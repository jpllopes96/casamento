import Head from 'next/head'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/router'
import { isAuthenticated } from '../../lib/auth'
import { readData } from '../../lib/data'
import { enrichGrupos, FAIXAS } from '../../lib/utils'
import styles from '../../styles/Admin.module.css'

export async function getServerSideProps({ req }) {
  if (!isAuthenticated(req)) {
    return { redirect: { destination: '/admin/login', permanent: false } }
  }
  const { grupos } = await readData()
  return { props: { gruposInicial: enrichGrupos(grupos) } }
}

function maskDate(value) {
  const d = value.replace(/\D/g, '').substring(0, 8)
  if (d.length > 4) return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`
  if (d.length > 2) return `${d.slice(0, 2)}/${d.slice(2)}`
  return d
}

const guestTpl = () => ({ nome: '', dataNascimento: '' })

export default function AdminDashboard({ gruposInicial }) {
  const router = useRouter()
  const [grupos, setGrupos] = useState(gruposInicial)
  const [faixaAtiva, setFaixaAtiva] = useState('todos')
  const [busca, setBusca] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modalGuests, setModalGuests] = useState([guestTpl()])
  const [modalLoading, setModalLoading] = useState(false)
  const [modalErrors, setModalErrors] = useState({})
  const [expandedGroups, setExpandedGroups] = useState({})

  // Flat list of all guests with group info
  const todosConvidados = useMemo(() => {
    const list = []
    grupos.forEach(g => {
      g.convidados.forEach((c, i) => {
        list.push({
          grupoId: g.id,
          enviadoEm: g.enviadoEm,
          manual: g.adicionadoManualmente || false,
          ...c,
          tipo: i === 0 ? 'Principal' : `Acompanhante ${i}`,
        })
      })
    })
    return list
  }, [grupos])

  // Stats
  const stats = useMemo(() => {
    const total = todosConvidados.length
    const por = { '0-5': 0, '6-7': 0, '8-17': 0, '18+': 0 }
    todosConvidados.forEach(c => { if (por[c.faixa] !== undefined) por[c.faixa]++ })
    return { totalGrupos: grupos.length, total, por }
  }, [todosConvidados, grupos])

  // Filtered + searched list
  const listaFiltrada = useMemo(() => {
    let list = faixaAtiva === 'todos' ? todosConvidados : todosConvidados.filter(c => c.faixa === faixaAtiva)
    if (busca.trim()) {
      const q = busca.trim().toLowerCase()
      list = list.filter(c => c.nome.toLowerCase().includes(q))
    }
    return list
  }, [todosConvidados, faixaAtiva, busca])

  async function handleLogout() {
    await fetch('/api/admin/logout')
    router.push('/admin/login')
  }

  async function handleDeleteGroup(grupoId) {
    if (!confirm(`Remover Grupo ${grupoId} e todos os seus convidados?`)) return
    const res = await fetch(`/api/admin/deletar?id=${grupoId}`, { method: 'DELETE' })
    if (res.ok) setGrupos(prev => prev.filter(g => g.id !== grupoId))
  }

  // Modal logic
  function updateModalGuest(idx, field, value) {
    setModalGuests(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      return next
    })
    setModalErrors(prev => { const n = { ...prev }; delete n[`${idx}_${field}`]; return n })
  }

  function validateModal() {
    const errs = {}
    modalGuests.forEach((g, i) => {
      if (!g.nome.trim() || g.nome.trim().length < 2) errs[`${i}_nome`] = 'Informe o nome'
      if (!g.dataNascimento || !/^\d{2}\/\d{2}\/\d{4}$/.test(g.dataNascimento)) errs[`${i}_dataNascimento`] = 'Data inválida'
    })
    return errs
  }

  async function handleModalSubmit(e) {
    e.preventDefault()
    const errs = validateModal()
    if (Object.keys(errs).length > 0) { setModalErrors(errs); return }
    setModalLoading(true)
    try {
      const res = await fetch('/api/admin/adicionar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ convidados: modalGuests }),
      })
      if (res.ok) {
        setShowModal(false)
        setModalGuests([guestTpl()])
        setModalErrors({})
        router.replace(router.asPath) // refresh SSR data
      } else {
        const d = await res.json()
        alert(d.error || 'Erro ao adicionar')
      }
    } catch {
      alert('Erro de conexão')
    } finally {
      setModalLoading(false)
    }
  }

  async function handleExportPDF() {
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default

    const doc = new jsPDF({ orientation: 'landscape' })

    doc.setFontSize(18)
    doc.text('Confirmações de Presença – Casamento 17/04/2027', 14, 18)
    doc.setFontSize(10)
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 25)
    doc.text(`Total: ${stats.total} convidados em ${stats.totalGrupos} grupos`, 14, 31)

    const rows = listaFiltrada.map(c => [
      `Grupo ${c.grupoId}`,
      c.nome,
      c.tipo,
      c.dataNascimento,
      c.idade !== null ? `${c.idade} anos` : '—',
      c.faixa === '0-5' ? '0–5 anos' : c.faixa === '6-7' ? '6–7 anos' : c.faixa === '8-17' ? '8–17 anos' : c.faixa === '18+' ? '18+ anos' : '—',
      new Date(c.enviadoEm).toLocaleDateString('pt-BR'),
    ])

    autoTable(doc, {
      head: [['Grupo', 'Nome', 'Tipo', 'Data de Nasc.', 'Idade', 'Faixa Etária', 'Enviado em']],
      body: rows,
      startY: 37,
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [185, 149, 42], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [250, 246, 240] },
    })

    doc.save('confirmacoes-casamento.pdf')
  }

  async function handleExportExcel() {
    const XLSX = await import('xlsx')

    const rows = listaFiltrada.map(c => ({
      'Grupo': `Grupo ${c.grupoId}`,
      'Nome': c.nome,
      'Tipo': c.tipo,
      'Data de Nascimento': c.dataNascimento,
      'Idade (17/04/2027)': c.idade !== null ? c.idade : '',
      'Faixa Etária': c.faixa === '0-5' ? '0–5 anos' : c.faixa === '6-7' ? '6–7 anos' : c.faixa === '8-17' ? '8–17 anos' : c.faixa === '18+' ? '18+ anos' : '—',
      'Adicionado Manualmente': c.manual ? 'Sim' : 'Não',
      'Enviado em': new Date(c.enviadoEm).toLocaleString('pt-BR'),
    }))

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Confirmações')

    // Auto column width
    const colWidths = Object.keys(rows[0] || {}).map(k => ({ wch: Math.max(k.length, 14) }))
    ws['!cols'] = colWidths

    XLSX.writeFile(wb, 'confirmacoes-casamento.xlsx')
  }

  return (
    <div className={styles.page}>
      <Head>
        <title>Admin – Confirmações</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerHeart}><HeartIcon /></span>
          <div>
            <h1 className={styles.headerTitle}>Área Administrativa</h1>
            <p className={styles.headerSub}>Casamento – 17 de Abril de 2027</p>
          </div>
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <LogoutIcon /> Sair
        </button>
      </header>

      <main className={styles.main}>
        {/* Stats */}
        <div className={styles.statsGrid}>
          <StatCard icon={<GroupIcon />} label="Grupos" value={stats.totalGrupos} />
          <StatCard icon={<PeopleIcon />} label="Convidados" value={stats.total} />
          <StatCard icon={<AdultIcon />} label="Adultos (18+)" value={stats.por['18+']} gold />
          <StatCard icon={<TeenIcon />} label="Jovens (8–17)" value={stats.por['8-17']} />
          <StatCard icon={<ChildIcon />} label="Crianças (6–7)" value={stats.por['6-7']} />
          <StatCard icon={<BabyIcon />} label="Bebês (0–5)" value={stats.por['0-5']} />
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.filters}>
            {FAIXAS.map(f => (
              <button
                key={f.key}
                className={`${styles.filterBtn} ${faixaAtiva === f.key ? styles.filterBtnActive : ''}`}
                onClick={() => setFaixaAtiva(f.key)}
              >
                {f.label}
                <span className={styles.filterCount}>
                  {f.key === 'todos' ? todosConvidados.length : todosConvidados.filter(c => c.faixa === f.key).length}
                </span>
              </button>
            ))}
          </div>

          <div className={styles.toolbarRight}>
            <div className={styles.searchBox}>
              <SearchIcon />
              <input
                className={styles.searchInput}
                placeholder="Buscar por nome..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
              />
            </div>
            <button className={styles.actionBtn} onClick={handleExportPDF} title="Exportar PDF">
              <PdfIcon /> PDF
            </button>
            <button className={styles.actionBtn} onClick={handleExportExcel} title="Exportar Excel">
              <ExcelIcon /> Excel
            </button>
            <button className={`${styles.actionBtn} ${styles.actionBtnGold}`} onClick={() => setShowModal(true)}>
              <PlusIcon /> Adicionar
            </button>
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableWrap}>
          {listaFiltrada.length === 0 ? (
            <div className={styles.empty}>
              <HeartIcon />
              <p>Nenhum convidado encontrado.</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Grupo</th>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Data de Nasc.</th>
                  <th>Idade</th>
                  <th>Faixa Etária</th>
                  <th>Enviado em</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {listaFiltrada.map((c, i) => (
                  <tr key={i} className={c.manual ? styles.rowManual : ''}>
                    <td>
                      <span className={styles.grupoBadge}>Grupo {c.grupoId}</span>
                      {c.manual && <span className={styles.manualTag}>manual</span>}
                    </td>
                    <td className={styles.nameCell}>{c.nome}</td>
                    <td className={styles.tipoCell}>{c.tipo}</td>
                    <td>{c.dataNascimento}</td>
                    <td>
                      <span className={`${styles.ageBadge} ${styles['age_' + c.faixa?.replace('+', 'plus')]}`}>
                        {c.idade !== null ? `${c.idade} anos` : '—'}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.faixaBadge} ${styles['faixa_' + c.faixa?.replace('+', 'plus')]}`}>
                        {c.faixa === '0-5' ? '0–5 anos' : c.faixa === '6-7' ? '6–7 anos' : c.faixa === '8-17' ? '8–17 anos' : c.faixa === '18+' ? '18+ anos' : '—'}
                      </span>
                    </td>
                    <td className={styles.dateCell}>{new Date(c.enviadoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDeleteGroup(c.grupoId)}
                        title="Remover grupo"
                      >
                        <TrashIcon />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p className={styles.showing}>
          Mostrando {listaFiltrada.length} de {todosConvidados.length} convidados
        </p>
      </main>

      {/* Add Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Adicionar Confirmação</h2>
              <button className={styles.modalClose} onClick={() => { setShowModal(false); setModalGuests([guestTpl()]); setModalErrors({}) }}>
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className={styles.modalForm} noValidate>
              {modalGuests.map((g, idx) => (
                <div key={idx} className={styles.modalCard}>
                  <div className={styles.modalCardHeader}>
                    <span>{idx === 0 ? 'Convidado Principal' : `Acompanhante ${idx}`}</span>
                    {idx > 0 && (
                      <button type="button" className={styles.removeBtn} onClick={() => setModalGuests(prev => prev.filter((_, i) => i !== idx))}>
                        <TrashIcon />
                      </button>
                    )}
                  </div>
                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}><PersonIcon /> Nome Completo</label>
                    <input
                      type="text"
                      className={`${styles.modalInput} ${modalErrors[`${idx}_nome`] ? styles.inputError : ''}`}
                      placeholder="Nome completo"
                      value={g.nome}
                      onChange={e => updateModalGuest(idx, 'nome', e.target.value)}
                    />
                    {modalErrors[`${idx}_nome`] && <span className={styles.errMsg}>{modalErrors[`${idx}_nome`]}</span>}
                  </div>
                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}><CalendarIcon /> Data de Nascimento</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      className={`${styles.modalInput} ${modalErrors[`${idx}_dataNascimento`] ? styles.inputError : ''}`}
                      placeholder="DD/MM/AAAA"
                      value={g.dataNascimento}
                      onChange={e => updateModalGuest(idx, 'dataNascimento', maskDate(e.target.value))}
                      maxLength={10}
                    />
                    {modalErrors[`${idx}_dataNascimento`] && <span className={styles.errMsg}>{modalErrors[`${idx}_dataNascimento`]}</span>}
                  </div>
                </div>
              ))}

              <button type="button" className={styles.addCompBtn} onClick={() => setModalGuests(prev => [...prev, guestTpl()])}>
                <PlusIcon /> Adicionar Acompanhante
              </button>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => { setShowModal(false); setModalGuests([guestTpl()]); setModalErrors({}) }}>
                  Cancelar
                </button>
                <button type="submit" className={styles.saveBtn} disabled={modalLoading}>
                  {modalLoading ? 'SALVANDO...' : 'CONFIRMAR PRESENÇA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, gold }) {
  return (
    <div className={`${styles.statCard} ${gold ? styles.statCardGold : ''}`}>
      <span className={styles.statIcon}>{icon}</span>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  )
}

// Icons
function HeartIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
}
function GroupIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
}
function PeopleIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}
function AdultIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></svg>
}
function TeenIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="3.5"/><path d="M19 20v-1.5a4.5 4.5 0 0 0-4.5-4.5h-5A4.5 4.5 0 0 0 5 18.5V20"/></svg>
}
function ChildIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="6" r="3"/><path d="M17 19v-1a5 5 0 0 0-10 0v1"/></svg>
}
function BabyIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="5" r="2.5"/><path d="M15 12H9l-2 7h10l-2-7z"/></svg>
}
function LogoutIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
}
function SearchIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
}
function PdfIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>
}
function ExcelIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
}
function PlusIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
}
function TrashIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
}
function CloseIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
}
function PersonIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
}
function CalendarIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
}

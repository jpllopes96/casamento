import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/router'
import styles from '../styles/Confirmar.module.css'

const guestTemplate = () => ({ nome: '', dataNascimento: '' })

function maskDate(value) {
  const digits = value.replace(/\D/g, '').substring(0, 8)
  if (digits.length > 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
  }
  if (digits.length > 2) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`
  }
  return digits
}

function isValidDate(value) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return false
  const [d, m, y] = value.split('/').map(Number)
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2100) return false
  return true
}

export default function Confirmar() {
  const router = useRouter()
  const [guests, setGuests] = useState([guestTemplate()])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  function updateGuest(index, field, value) {
    setGuests(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
    setErrors(prev => {
      const next = { ...prev }
      delete next[`${index}_${field}`]
      return next
    })
  }

  function addGuest() {
    setGuests(prev => [...prev, guestTemplate()])
  }

  function removeGuest(index) {
    setGuests(prev => prev.filter((_, i) => i !== index))
    setErrors(prev => {
      const next = {}
      for (const key of Object.keys(prev)) {
        const [ki] = key.split('_')
        if (Number(ki) !== index) {
          const newIdx = Number(ki) > index ? Number(ki) - 1 : Number(ki)
          next[`${newIdx}_${key.split('_')[1]}`] = prev[key]
        }
      }
      return next
    })
  }

  function validate() {
    const newErrors = {}
    guests.forEach((g, i) => {
      if (!g.nome.trim() || g.nome.trim().length < 2) {
        newErrors[`${i}_nome`] = 'Informe o nome completo'
      }
      if (!g.dataNascimento || !isValidDate(g.dataNascimento)) {
        newErrors[`${i}_dataNascimento`] = 'Informe uma data válida (DD/MM/AAAA)'
      }
    })
    return newErrors
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/confirmar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ convidados: guests }),
      })
      const data = await res.json()
      if (res.ok) {
        router.push(`/sucesso?grupo=${data.grupoId}`)
      } else {
        alert(data.error || 'Erro ao confirmar presença. Tente novamente.')
      }
    } catch {
      alert('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <Head>
        <title>Confirmar Presença – 17/04/2027</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <header className={styles.header}>
        <Link href="/" className={styles.back}>
          <ArrowIcon /> Voltar
        </Link>
        <div className={styles.eventInfo}>
          <div className={styles.badge}>
            <span>SAVE THE DATE</span>
            <span className={styles.badgeSep}>|</span>
            <span>17 de Abril de 2027</span>
          </div>
          <p className={styles.eventMeta}>
            <PinSmallIcon />
            Restaurante Lago da Serra &nbsp;·&nbsp; Sábado, às 16h00
          </p>
        </div>
        <div style={{ width: 80 }} />
      </header>

      <main className={styles.main}>
        <div className={styles.titleBlock}>
          <span className={styles.heartGold}><HeartIcon /></span>
          <h1 className={styles.title}>Confirmar Presença</h1>
          <p className={styles.subtitle}>Preencha os dados de todos os convidados</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {guests.map((guest, index) => (
            <div key={index} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardLabel}>
                  {index === 0 ? 'Convidado Principal' : `Acompanhante ${index}`}
                </span>
                {index > 0 && (
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => removeGuest(index)}
                    aria-label="Remover acompanhante"
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  <PersonIcon /> Nome Completo
                </label>
                <input
                  type="text"
                  className={`${styles.input} ${errors[`${index}_nome`] ? styles.inputError : ''}`}
                  placeholder="Digite o nome completo"
                  value={guest.nome}
                  onChange={e => updateGuest(index, 'nome', e.target.value)}
                  autoComplete="off"
                />
                {errors[`${index}_nome`] && (
                  <span className={styles.errorMsg}>{errors[`${index}_nome`]}</span>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  <CalendarIcon /> Data de Nascimento
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  className={`${styles.input} ${errors[`${index}_dataNascimento`] ? styles.inputError : ''}`}
                  placeholder="DD/MM/AAAA"
                  value={guest.dataNascimento}
                  onChange={e => updateGuest(index, 'dataNascimento', maskDate(e.target.value))}
                  maxLength={10}
                />
                {errors[`${index}_dataNascimento`] && (
                  <span className={styles.errorMsg}>{errors[`${index}_dataNascimento`]}</span>
                )}
              </div>
            </div>
          ))}

          <button type="button" className={styles.addBtn} onClick={addGuest}>
            <PlusIcon /> Adicionar Acompanhante
          </button>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'CONFIRMANDO...' : 'CONFIRMAR PRESENÇA'}
          </button>
        </form>
      </main>
    </div>
  )
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

function PinSmallIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function PersonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

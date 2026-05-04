import { getPool, ensureDB } from './db'

export async function readData() {
  await ensureDB()
  const db = getPool()

  const [gruposRes, convidadosRes] = await Promise.all([
    db.query('SELECT id, enviado_em, adicionado_manualmente FROM grupos ORDER BY id'),
    db.query('SELECT grupo_id, nome, data_nascimento FROM convidados ORDER BY grupo_id, ordem'),
  ])

  const grupos = gruposRes.rows.map(g => ({
    id: g.id,
    enviadoEm: g.enviado_em.toISOString(),
    adicionadoManualmente: g.adicionado_manualmente,
    convidados: convidadosRes.rows
      .filter(c => c.grupo_id === g.id)
      .map(c => ({ nome: c.nome, dataNascimento: c.data_nascimento })),
  }))

  return { grupos }
}

export async function addGrupo(convidados, manual = false) {
  await ensureDB()
  const db = getPool()
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query(
      'INSERT INTO grupos (adicionado_manualmente) VALUES ($1) RETURNING id',
      [manual]
    )
    const grupoId = rows[0].id
    for (let i = 0; i < convidados.length; i++) {
      await client.query(
        'INSERT INTO convidados (grupo_id, nome, data_nascimento, ordem) VALUES ($1, $2, $3, $4)',
        [grupoId, convidados[i].nome, convidados[i].dataNascimento, i]
      )
    }
    await client.query('COMMIT')
    return grupoId
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function deleteGrupo(id) {
  await ensureDB()
  const db = getPool()
  await db.query('DELETE FROM grupos WHERE id = $1', [id])
}

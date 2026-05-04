import { isAuthenticated } from '../../../lib/auth'
import { addGrupo } from '../../../lib/data'

export default async function handler(req, res) {
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Não autorizado' })
  if (req.method !== 'POST') return res.status(405).end()

  const { convidados } = req.body

  if (!Array.isArray(convidados) || convidados.length === 0)
    return res.status(400).json({ error: 'Pelo menos um convidado é necessário.' })

  for (const c of convidados) {
    if (!c.nome || c.nome.trim().length < 2)
      return res.status(400).json({ error: 'Nome inválido.' })
    if (!c.dataNascimento || !/^\d{2}\/\d{2}\/\d{4}$/.test(c.dataNascimento))
      return res.status(400).json({ error: 'Data de nascimento inválida.' })
  }

  try {
    const grupoId = await addGrupo(
      convidados.map(c => ({ nome: c.nome.trim(), dataNascimento: c.dataNascimento })),
      true
    )
    return res.status(200).json({ ok: true, grupoId })
  } catch (err) {
    console.error('[admin/adicionar]', err)
    return res.status(500).json({ error: 'Erro ao salvar.' })
  }
}

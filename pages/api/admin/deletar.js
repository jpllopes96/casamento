import { isAuthenticated } from '../../../lib/auth'
import { deleteGrupo } from '../../../lib/data'

export default async function handler(req, res) {
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Não autorizado' })
  if (req.method !== 'DELETE') return res.status(405).end()

  const grupoId = Number(req.query.id)
  if (!grupoId) return res.status(400).json({ error: 'ID inválido' })

  try {
    await deleteGrupo(grupoId)
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('[admin/deletar]', err)
    return res.status(500).json({ error: 'Erro ao deletar.' })
  }
}

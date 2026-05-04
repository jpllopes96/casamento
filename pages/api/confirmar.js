import { addGrupo } from '../../lib/data'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const { convidados } = req.body

  if (!Array.isArray(convidados) || convidados.length === 0) {
    return res.status(400).json({ error: 'Pelo menos um convidado é necessário.' })
  }
  for (const c of convidados) {
    if (!c.nome || c.nome.trim().length < 2)
      return res.status(400).json({ error: 'Nome inválido em um dos convidados.' })
    if (!c.dataNascimento || !/^\d{2}\/\d{2}\/\d{4}$/.test(c.dataNascimento))
      return res.status(400).json({ error: 'Data de nascimento inválida em um dos convidados.' })
  }

  try {
    const grupoId = await addGrupo(
      convidados.map(c => ({ nome: c.nome.trim(), dataNascimento: c.dataNascimento }))
    )
    return res.status(200).json({ success: true, grupoId })
  } catch (err) {
    console.error('[confirmar]', err)
    return res.status(500).json({ error: 'Erro ao salvar. Tente novamente.' })
  }
}

import { setAuthCookie } from '../../../lib/auth'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'joaolacaia96@gmail.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'casamento@2027'

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email, senha } = req.body

  if (
    email?.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase() ||
    senha !== ADMIN_PASSWORD
  ) {
    return res.status(401).json({ error: 'Email ou senha incorretos.' })
  }

  setAuthCookie(res)
  return res.status(200).json({ ok: true })
}

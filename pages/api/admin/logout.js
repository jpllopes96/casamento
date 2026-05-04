import { clearAuthCookie } from '../../../lib/auth'

export default function handler(req, res) {
  clearAuthCookie(res)
  res.redirect(302, '/admin/login')
}

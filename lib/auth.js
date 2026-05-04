const TOKEN = process.env.ADMIN_TOKEN || 'ck-casamento-admin-2027-secret'
const COOKIE_NAME = 'admin_token'
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export function isAuthenticated(req) {
  return req.cookies?.[COOKIE_NAME] === TOKEN
}

export function setAuthCookie(res) {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${TOKEN}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${MAX_AGE}`
  )
}

export function clearAuthCookie(res) {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`
  )
}

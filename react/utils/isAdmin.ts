import { canUseDOM } from 'exenv'

/**
 * This function checks if anything is running in the Admin environment,
 * without relying on Render's own features.
 */
export function isAdmin() {
  if (!canUseDOM) {
    return false
  }

  const { host } = window.location

  const isMyvtexDomain = host.includes('myvtex.com')

  if (!isMyvtexDomain) {
    return false
  }

  const adminPathnames = [
    '/admin',
    '/_v/segment/admin-login/v1/login', // Let's consider the Admin Login page as an Admin App even though it's technically not.
  ]

  const { pathname } = window.location

  return adminPathnames.some((path) => pathname.startsWith(path))
}

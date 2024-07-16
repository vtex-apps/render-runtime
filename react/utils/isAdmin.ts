import { canUseDOM } from 'exenv'

/**
 * This function checks if anything is running in the Admin environment,
 * without relying on Render's own features.
 */
export function isAdmin() {
  if (canUseDOM) {
    const { host } = window.location

    const domain = host.match(/(?<=\.)([^.]+\.[^.]+$)/)?.[0]

    if (
      domain === 'myvtex.com' &&
      (window.location.pathname.startsWith('/admin') ||
        // Let's consider the Admin Login page as an Admin App even though it's technically not
        window.location.pathname.startsWith('/_v/segment/admin-login/v1/login'))
    ) {
      return true
    }
  }

  return false
}

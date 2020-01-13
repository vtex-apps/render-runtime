import { canUseDOM } from 'exenv'

const ONE_YEAR_S = 60 * 60 * 24 * 365

export const setCookie = (
  key: string,
  value: string,
  path = '/',
  maxAge: number = ONE_YEAR_S
) => {
  if (!canUseDOM) {
    return
  }

  window.document.cookie = `${key}=${value};path=${path};max-age=${maxAge}`
}

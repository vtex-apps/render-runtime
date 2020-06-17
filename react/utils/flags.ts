const flags = {
  RENDER_NAVIGATION: true,
  VTEX_ASSETS_URL: true,
  PREFETCH: false,
}

window.flags = flags

export const isEnabled = (flag: keyof typeof flags) => window.flags[flag]

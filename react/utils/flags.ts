const flags = {
  VTEX_ASSETS_URL: true,
  PREFETCH: true,
}

window.flags = flags

export const isEnabled = (flag: keyof typeof flags) => window.flags[flag]

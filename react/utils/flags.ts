const flags = {
  RENDER_NAVIGATION: false,
}

window.flags = flags

export const isEnabled = (flag: keyof typeof flags) => window.flags[flag]

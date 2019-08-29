const flags = {
  RENDER_NAVIGATION: true,
}

window.flags = flags

export const isEnabled = (flag: keyof typeof flags) => window.flags[flag]

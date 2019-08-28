const flags = {
  RENDER_NAVIGATION: Math.random() < 0.5,
}

window.flags = flags

export const isEnabled = (flag: keyof typeof flags) => window.flags[flag]

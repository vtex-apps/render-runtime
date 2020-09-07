export const registerRuntimeGlobals = (runtimeGlobals: any) => {
  window.__RENDER_8_RUNTIME__ = { ...runtimeGlobals }

  // compatibility
  window.__RENDER_8_COMPONENTS__ =
    window.__RENDER_8_COMPONENTS__ || global.__RENDER_8_COMPONENTS__
  window.__RENDER_8_HOT__ = window.__RENDER_8_HOT__ || global.__RENDER_8_HOT__
}

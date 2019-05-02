import maybeWrapWithHMR from './withHMR'

const idToAppAtMajor = (appId: string) => {
  const [name, version] = appId.split('@')
  const [major] = version.split('.')
  return `${name}@${major}.x`
}

export default (module: Module, InitialImplementer: any, app: string, name: string) => {
  const wrappedComponent = maybeWrapWithHMR(module, InitialImplementer)
  window.__RENDER_8_COMPONENTS__[`${app}/${name}`] = wrappedComponent
  window.__RENDER_8_COMPONENTS__[`${idToAppAtMajor(app)}/${name}`] = wrappedComponent
  return wrappedComponent
}

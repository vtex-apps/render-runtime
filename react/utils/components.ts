const concatUniq = <T>(...arrays: T[][]) => {
  return arrays.reduce((acc, array) => {
    return [...acc, ...array.filter(item => !acc.includes(item))]
  }, [] as T[])
}

export const traverseComponent = (components: Components, component: string): ComponentTraversalResult => {
  const {dependencies, overrides = [], assets} = components[component]
  const [app] = component.split('/')
  const [before, after] = [dependencies, overrides].map(traverseComponents(components))

  return {
    apps: concatUniq(before.apps, [app], after.apps),
    assets: concatUniq(before.assets, assets),
    overrides: concatUniq(after.assets, after.overrides)
  }
}

const traverseComponents = (components: Components) => (componentList: string[]) => {
  return componentList
    .map(component => traverseComponent(components, component))
    .reduce((acc, result) => ({
      apps: concatUniq(acc.apps, result.apps),
      assets: concatUniq(acc.assets, result.assets),
      overrides: concatUniq(acc.overrides, result.overrides),
    }), {apps: [], assets: [], overrides: []})
}

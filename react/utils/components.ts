const prependUniq = (arrOne: any[], arrTwo: any[]) => {
  return [...arrOne, ...arrTwo.filter(item => !arrOne.includes(item))]
}

export const traverseComponent = (components: Components | Record<string, string[]>, component: string): ComponentTraversalResult => {
  const entry = components[component]
  const [app] = component.split('/')
  if (Array.isArray(entry)) {
    return {apps: [app], assets: entry}
  }

  const {dependencies, overrides = [], assets} = entry

  const dependenciesResult = dependencies
    .map(dep => traverseComponent(components, dep))
    .reduce((acc, dependency) => ({
      apps: prependUniq(dependency.apps, acc.apps),
      assets: prependUniq(dependency.assets, acc.assets)
    }), {apps: [app], assets})

  const overridesResult = overrides
    .map(ov => traverseComponent(components, ov))
    .reduce((acc, dependency) => ({
      apps: prependUniq(dependency.apps, acc.apps),
      assets: prependUniq(dependency.assets, acc.assets)
    }), {apps: [app], assets})

  return {
    apps: prependUniq(dependenciesResult.apps, overridesResult.apps),
    assets: prependUniq(dependenciesResult.assets, overridesResult.assets),
  }
}

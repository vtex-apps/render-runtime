const prependUniq = (arrOne: any[], arrTwo: any[]) => {
  return [...arrOne.filter(item => !arrTwo.includes(item)), ...arrTwo]
}

export const traverseComponent = (components: Components | Record<string, string[]>, component: string): ComponentTraversalResult => {
  const entry = components[component]
  const [app] = component.split('/')
  if (Array.isArray(entry)) {
    return {apps: [app], assets: entry}
  }

  const {dependencies, assets} = entry
  return dependencies
    .map(dep => traverseComponent(components, dep))
    .reduce((acc, dependency) => ({
      apps: prependUniq(dependency.apps, acc.apps),
      assets: prependUniq(dependency.assets, acc.assets)
    }), {apps: [app], assets})
}

const FILE_PATH_REX = /([^/]+?)(?:$|\?)/ // https://regex101.com/r/joJ2p7/1
const FILE_EXT_REX = /(\.min)?(\.js|\.css)/ // https://regex101.com/r/8vmjes/1

const prependUniq = (arrOne: any[], arrTwo: any[]) => {
  return [...arrOne, ...arrTwo.filter(item => !arrOne.includes(item))]
}

export const traverseComponent = (
  components: Components | Record<string, string[]>,
  component: string
): ComponentTraversalResult => {
  const entry = components[component]
  const [app] = component.split('/')
  if (Array.isArray(entry)) {
    return {
      apps: [app],
      assets: entry.map(asset => {
        return { path: asset, app, name: assetName(asset) }
      }),
    }
  }

  const { dependencies, assets } = entry
  return dependencies
    .map(dep => traverseComponent(components, dep))
    .reduce(
      (acc, dependency) => ({
        apps: prependUniq(dependency.apps, acc.apps),
        assets: prependUniq(dependency.assets, acc.assets),
      }),
      {
        apps: [app],
        assets: assets.map(asset => {
          return { path: asset, app, name: assetName(asset) }
        }),
      }
    )
}

const assetName = (asset: string) => {
  const baseNameMatch = FILE_PATH_REX.exec(asset)
  const baseName =
    baseNameMatch && baseNameMatch.length > 0 ? baseNameMatch[1] : ''
  const assetName = baseName.replace(FILE_EXT_REX, '')
  return assetName
}

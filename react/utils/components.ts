import { uniqWith } from 'ramda'

const FILE_PATH_REX = /([^/]+?)(?:$|\?)/ // https://regex101.com/r/joJ2p7/1
const FILE_EXT_REX = /(\.min)?(\.js|\.css)/ // https://regex101.com/r/8vmjes/1

const uniqAsset = uniqWith<AssetEntry, AssetEntry>((a, b) => {
  return a.app === b.app && a.name === b.name && a.path === b.path
})

export const traverseListOfComponents = (
  componentsData: Components | Record<string, string[]>,
  componentsToTraverse: string[]
) => {
  const allAssets = componentsToTraverse.reduce((acc, component) => {
    const assets = traverseComponent(componentsData, component, false)
    return acc.concat(assets)
  }, [] as AssetEntry[])

  return uniqAsset(allAssets)
}

export const traverseComponent = (
  components: Components | Record<string, string[]>,
  component: string,
  isRoot = true
): AssetEntry[] => {
  const entry = components[component]
  const [app] = component.split('/')
  if (Array.isArray(entry)) {
    return entry.map(asset => {
      return { path: asset, app, name: assetName(asset) }
    })
  }
  const { dependencies, assets } = entry
  const assetsForDeps = dependencies.reduce(
    (acc, dependency) => {
      const depAssets = traverseComponent(components, dependency, false)
      return acc.concat(depAssets)
    },
    assets.map(asset => {
      return { path: asset, app, name: assetName(asset) }
    })
  )

  if (isRoot) {
    return uniqAsset(assetsForDeps)
  }
  return assetsForDeps
}

const assetName = (asset: string) => {
  const baseNameMatch = FILE_PATH_REX.exec(asset)
  const baseName =
    baseNameMatch && baseNameMatch.length > 0 ? baseNameMatch[1] : ''
  const assetName = baseName.replace(FILE_EXT_REX, '')
  return assetName
}

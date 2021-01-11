import { uniqWith } from 'ramda'
import { hasComponentImplementation, fetchAssets } from './assets'
import { AssetEntry } from '../typings/global'
import { RenderRuntime, Extensions, BlockInsertion } from '../typings/runtime'

const FILE_PATH_REX = /([^/]+?)(?:$|\?)/ // https://regex101.com/r/joJ2p7/1
const FILE_EXT_REX = /(\.min)?(\.js|\.css)/ // https://regex101.com/r/8vmjes/1

const uniqAsset = uniqWith<AssetEntry, AssetEntry>((a, b) => a.path === b.path)

const getAppAndVersion = (locator: string) => {
  const [appAtVersion] = locator.split('/')
  const [app, version] = appAtVersion.split('@')
  return { app, version }
}

export const isConflictingLoadedComponents = (
  navigatedComponents: RenderRuntime['components'],
  loadedComponents: RenderRuntime['components']
) => {
  const loadedVersionsByApp = Object.keys(loadedComponents).reduce(
    (acc, locator) => {
      const { app, version } = getAppAndVersion(locator)
      const [major] = version.split('.')
      if (!acc[app]) {
        acc[app] = { [major]: version }
      } else {
        acc[app][major] = version
      }
      return acc
    },
    {} as Record<string, Record<string, string>>
  )

  return Object.keys(navigatedComponents).some((locator) => {
    const { app, version } = getAppAndVersion(locator)
    const [major] = version.split('.')
    const loadedVersion = loadedVersionsByApp[app]?.[major]

    return loadedVersion && loadedVersion !== version
  })
}

export const fetchComponents = async (
  components: RenderRuntime['components'],
  runtime: RenderRuntime,
  extensions?: Extensions
) => {
  // In order for only fetching `components`, we create corresponding extensions
  // for them if they weren't passed
  if (!extensions) {
    const componentsNames = Object.keys(components)
    extensions = componentsNames.reduce((acc, component) => {
      acc[component] = { component }
      return acc
    }, {} as RenderRuntime['extensions'])
  }
  const componentsToDownload = Object.values(extensions).reduce<string[]>(
    (acc, extension) => {
      if (!extension) {
        return acc
      }
      if (extension.render === 'lazy') {
        return acc
      }
      if (!hasComponentImplementation(extension.component)) {
        acc.push(extension.component)
      }
      const context = extension?.context?.component
      if (context && !hasComponentImplementation(context)) {
        acc.push(context)
      }
      return acc
    },
    []
  )

  if (componentsToDownload.length === 0) {
    return
  }

  const allAssets = traverseListOfComponents(components, componentsToDownload)
  await fetchAssets(runtime, allAssets)
}

export const traverseListOfComponents = (
  componentsData: RenderRuntime['components'] | Record<string, string[]>,
  componentsToTraverse: string[]
) => {
  const allAssets = componentsToTraverse.reduce((acc, component) => {
    const assets = traverseComponent(componentsData, component, false)
    acc.push(...assets)
    return acc
  }, [] as AssetEntry[])

  return uniqAsset(allAssets)
}

export const traverseComponent = (
  components: RenderRuntime['components'] | Record<string, string[]>,
  component: string,
  isRoot = true
): AssetEntry[] => {
  const entry = components[component]
  const [app] = component.split('/')
  if (Array.isArray(entry)) {
    return entry.map((asset) => {
      return { path: asset, app, name: assetName(asset) }
    })
  }
  const { dependencies, assets } = entry
  const assetsForDeps = dependencies.reduce(
    (acc, dependency) => {
      const depAssets = traverseComponent(components, dependency, false)
      return depAssets.concat(acc)
    },
    assets.map((asset) => {
      return { path: asset, app, name: assetName(asset) }
    })
  )

  if (isRoot) {
    return uniqAsset(assetsForDeps)
  }
  return assetsForDeps
}

export const traverseExtension = (
  extensions: Extensions,
  components: RenderRuntime['components'],
  extensionId: string,
  isRoot: boolean
): AssetEntry[] => {
  const extension = extensions[extensionId]
  if (!extension) {
    return []
  }
  const children: string[] =
    extension.blocks?.map(
      (block: BlockInsertion) => `${extensionId}/${block.extensionPointId}`
    ) ?? []

  const component = extension.component

  const componentAssets = traverseComponent(components, component, isRoot)
  const childrenAssets = children
    .map((child: string) =>
      traverseExtension(extensions, components, child, false)
    )
    .reduce((acc, cur) => {
      acc.push(...cur)
      return acc
    }, [])

  return componentAssets.concat(childrenAssets)
}

const assetName = (asset: string) => {
  const baseNameMatch = FILE_PATH_REX.exec(asset)
  const baseName =
    baseNameMatch && baseNameMatch.length > 0 ? baseNameMatch[1] : ''
  const assetName = baseName.replace(FILE_EXT_REX, '')
  return assetName
}

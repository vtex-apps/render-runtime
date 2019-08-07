import path from 'path'
import { merge } from "ramda"

export const traverseComponent = (
  components: Components | ComponentTraversalResult,
  component: string
): ComponentTraversalResult => {
  const entry = components[component]
  const [app] = component.split('/')
  if (Array.isArray(entry)) {
    return { [app]: entry.map(asset => createAssetFile(app, asset))  } as ComponentTraversalResult
  }

  const { dependencies, assets } = entry
  const dependenciesTraversalResult = dependencies.map(dep => traverseComponent(components, dep))
  const traversalResult: ComponentTraversalResult = dependenciesTraversalResult.reduce((acc, dependencyTraversalResult) => {
    return {...acc, ...dependencyTraversalResult}
  }, { [app]: assets.map(asset => assetFileFromPath(app, asset) ) } )

  return traversalResult
}

const assetFileFromPath = (app: string, assetPath: string): AssetFile => {
  const fileName = path.basename(assetPath)
  const filePath = assetPath.replace(`/${app}/`, '/').replace(fileName,'')
  const bundleFilePath = filePath.replace('published/public', 'published/bundle/public')
  return {
    app,
    fileName,
    filePath,
    bundleFilePath
  }
}

const createAssetFile = (app: string, assetFile: AssetFile): AssetFile => {
  return {
    ...assetFile,
    app
  }
}
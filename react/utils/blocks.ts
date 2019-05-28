interface ExtensionResult {
  treePath: string
  extension: Extension
}

const createExtensions = (
  blockTreePath: string,
  extensionPath: string,
  bindingPath: string,
  outerNested: boolean,
  blocksTree: BlockContentTree,
  blocksMap: Blocks,
  contentMap: ContentMap
): ExtensionResult[] => {
  const result: ExtensionResult[] = []
  if (!blocksTree[blockTreePath]) {
    return result
  }

  const {blockId, contentIdMap} = blocksTree[blockTreePath]
  const block = blocksMap[blockId]
  const {after = [], around = [], before = [], blocks = []} = block
  const contentId = contentIdMap[bindingPath] || blockId

  const self = [{
    treePath: extensionPath,
    extension: {
      after: after.map(insertion => insertion.extensionPointId),
      around: around.map(insertion => insertion.extensionPointId),
      before: before.map(insertion => insertion.extensionPointId),
      blockId: block.blockId,
      blocks: blocks,
      component: block.component,
      composition: block.composition,
      content: contentMap[contentId] || {},
      context: block.context,
      preview: block.preview,
      props: block.props,
      render: block.render,
      track: block.track,
    }
  }]

  const afterExtensions = after.reduce((acc, {blockId: afterBlockId, extensionPointId}) => {
    const afterBlockTreePath = `after!${afterBlockId}`
    const afterExtensionPath = `${extensionPath}/${extensionPointId}`
    const afterResults = createExtensions(afterBlockTreePath, afterExtensionPath, bindingPath, true, blocksTree, blocksMap, contentMap)
    acc.push(...afterResults)
    return acc
  }, [] as ExtensionResult[])

  const aroundExtensions = around.reduce((acc, {blockId: aroundBlockId, extensionPointId}) => {
    const aroundBlockTreePath = `around!${aroundBlockId}`
    const aroundExtensionPath = `${extensionPath}/${extensionPointId}`
    const aroundResults = createExtensions(aroundBlockTreePath, aroundExtensionPath, bindingPath, true, blocksTree, blocksMap, contentMap)
    acc.push(...aroundResults)
    return acc
  }, [] as ExtensionResult[])

  const beforeExtensions = before.reduce((acc, {blockId: beforeBlockId, extensionPointId}) => {
    const beforeBlockTreePath = `before!${beforeBlockId}`
    const beforeExtensionPath = `${extensionPath}/${extensionPointId}`
    const beforeResults = createExtensions(beforeBlockTreePath, beforeExtensionPath, bindingPath, true, blocksTree, blocksMap, contentMap)
    acc.push(...beforeResults)
    return acc
  }, [] as ExtensionResult[])

  const innerExtensions = blocks.reduce((acc, {extensionPointId}) => {
    const innerBlockTreePath = `${blockTreePath}/${extensionPointId}`
    const innerExtensionPath = `${extensionPath}/${extensionPointId}`
    const innerBindingPath = outerNested ? bindingPath : `${bindingPath}/${extensionPointId}`
    const innerResults = createExtensions(innerBlockTreePath, innerExtensionPath, innerBindingPath, outerNested, blocksTree, blocksMap, contentMap)
    acc.push(...innerResults)
    return acc
  }, [] as ExtensionResult[])

  return result.concat(self, afterExtensions, aroundExtensions, beforeExtensions, innerExtensions)
}

export const generateExtensions = (
  blocksTree: BlockContentTree,
  blocks: Blocks,
  contentMap: ContentMap,
  pages: Pages
): Extensions => {
  return Object.keys(pages).reduce((acc, routeId) => {
    const routeResult = createExtensions(routeId, routeId, routeId, false, blocksTree, blocks, contentMap)
    routeResult.forEach(eachResult => {
      acc[eachResult.treePath] = eachResult.extension
    })
    return acc
  }, {} as Extensions)
}

interface ExtensionResult {
  treePath: string
  extension: Extension
}

export const withStar = (treePath: string) => {
  const parts = treePath.split('/')
  parts[0] = '*'
  return parts.join('/')
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

  const { blockIdMap, contentIdMap } = blocksTree[blockTreePath]
  const mappedBlockId =
    blockIdMap[extensionPath] ||
    blockIdMap[withStar(extensionPath)] ||
    blockIdMap['*']
  const block = blocksMap[mappedBlockId]
  const { blockId, after = [], around = [], before = [], blocks = [] } = block
  const blockContentMapId =
    contentIdMap[bindingPath] || contentIdMap[withStar(bindingPath)] || blockId
  const blockContentId = `${blockContentMapId}+${blockId}`

  let content = {}
  let contentIds = []
  if (contentMap[blockContentId]) {
    content = contentMap[blockContentId].content
      ? contentMap[blockContentId].content
      : contentMap[blockContentId]
    contentIds = contentMap[blockContentId].contentIds || []
  } else if (contentMap[blockContentMapId]) {
    content = contentMap[blockContentMapId].content
      ? contentMap[blockContentMapId].content
      : contentMap[blockContentMapId]
    contentIds = contentMap[blockContentMapId].contentIds || []
  }

  const self = [
    {
      treePath: extensionPath,
      extension: {
        after: after.map(insertion => insertion.extensionPointId),
        around: around.map(insertion => insertion.extensionPointId),
        before: before.map(insertion => insertion.extensionPointId),
        blockId: block.originalBlockId || blockId,
        blocks: blocks,
        component: block.component,
        composition: block.composition,
        content,
        contentIds,
        context: block.context,
        hasContentSchema: block.hasContentSchema,
        preview: block.preview,
        props: block.props,
        render: block.render,
        title: block.title,
        track: block.track,
      },
    },
  ]

  const [afterExtensions, aroundExtensions, beforeExtensions] = [
    after,
    around,
    before,
  ].map(outer => {
    return outer.reduce(
      (acc, { extensionPointId }) => {
        const outerExtensionPath = `${extensionPath}/${extensionPointId}`
        const outerResults = createExtensions(
          extensionPointId,
          outerExtensionPath,
          bindingPath,
          true,
          blocksTree,
          blocksMap,
          contentMap
        )
        acc.push(...outerResults)
        return acc
      },
      [] as ExtensionResult[]
    )
  })

  const innerExtensions = blocks.reduce(
    (acc, { extensionPointId }) => {
      const innerBlockTreePath = `${blockTreePath}/${extensionPointId}`
      const innerExtensionPath = `${extensionPath}/${extensionPointId}`
      const innerBindingPath = outerNested
        ? bindingPath
        : `${bindingPath}/${extensionPointId}`
      const innerResults = createExtensions(
        innerBlockTreePath,
        innerExtensionPath,
        innerBindingPath,
        outerNested,
        blocksTree,
        blocksMap,
        contentMap
      )
      acc.push(...innerResults)
      return acc
    },
    [] as ExtensionResult[]
  )

  return result.concat(
    self,
    afterExtensions,
    aroundExtensions,
    beforeExtensions,
    innerExtensions
  )
}

export const generateExtensions = (
  blocksTree: BlockContentTree,
  blocks: Blocks,
  contentMap: ContentMap,
  page: Page
): Extensions => {
  const extensions: Extensions = {}
  const routeId = page.routeId
  const routeResult = createExtensions(
    routeId,
    routeId,
    routeId,
    false,
    blocksTree,
    blocks,
    contentMap
  )
  routeResult.forEach(eachResult => {
    extensions[eachResult.treePath] = eachResult.extension
  })

  return extensions
}

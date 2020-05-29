import React, { ReactElement, FC, useMemo } from 'react'

import ComponentGetter from './components/ExtensionPoint/ComponentGetter'
import { useTreePath, useRuntime } from './core/main'
import { flatObj, transformLeaves } from './utils/object'

interface Props {
  virtualTreeId: string
  props?: Record<string, unknown>
}

interface RenderVirtualArgs {
  runtime: any
  treePath: string
  hydration: Hydration
  tree: VirtualTree
  key?: string
}

function getVirtualTree(virtualTreeId: string) {
  return window.__RUNTIME__.virtualTrees[virtualTreeId]
}

function renderVirtualComponent({
  hydration,
  runtime,
  treePath,
  tree,
  key = treePath,
}: RenderVirtualArgs): ReactElement<unknown> | null {
  if (tree.$component == null) {
    return null
  }

  const children = tree.children?.map((virtualChild, i) => {
    return renderVirtualComponent({
      hydration,
      runtime,
      treePath,
      key: `${key}-${i}-${virtualChild.$component}`,
      tree: virtualChild,
    })
  })

  return (
    <ComponentGetter
      component={tree.$component}
      props={tree.props ?? {}}
      treePath={treePath}
      hydration={hydration}
      runtime={runtime}
      key={key}
    >
      {children ?? null}
    </ComponentGetter>
  )
}
const VirtualComponent: FC<Props> = ({ virtualTreeId, props = {} }) => {
  const { treePath } = useTreePath()
  const runtime = useRuntime()

  const parsedTree = useMemo(() => {
    const tree = getVirtualTree(virtualTreeId)
    const flatProps = flatObj(props)

    return transformLeaves<VirtualTree>(tree, ({ value }) => {
      if (typeof value !== 'string') return

      const isDynamicValue = value.startsWith('$')
      if (!isDynamicValue) return

      const propKey = value.slice(1)
      if (!(propKey in flatProps)) return

      return flatProps[propKey]
    })
  }, [props, virtualTreeId])

  const extension = runtime.extensions[treePath]
  if (extension == null) {
    console.error(`Extension not found: "${treePath}"`)
    return null
  }

  const { hydration = 'always' } = extension

  return renderVirtualComponent({
    hydration,
    runtime,
    treePath,
    tree: parsedTree,
  })
}

export default VirtualComponent

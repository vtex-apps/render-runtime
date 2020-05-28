import React, { ReactElement, FC, useMemo } from 'react'

import { WrappedComponent } from './ComponentLoader'
import { useTreePath, useRuntime } from '../core/main'
import { flatObj, transformLeaves } from '../utils/object'

interface VirtualTree {
  interface: string
  props?: Record<string, unknown>
  children?: VirtualTree[]
}

interface Props {
  virtual: VirtualTree
  props?: Record<string, unknown>
}

interface RenderVirtualArgs {
  runtime: any
  treePath: string
  hydration: Hydration
  tree: VirtualTree
  key?: string
}

function renderVirtualComponent({
  hydration,
  runtime,
  treePath,
  tree,
  key = treePath,
}: RenderVirtualArgs): ReactElement<unknown> | null {
  if (tree.interface == null) {
    return null
  }

  const children = tree.children?.map((virtualChild, i) => {
    return renderVirtualComponent({
      hydration,
      runtime,
      treePath,
      key: `${key}-${i}-${virtualChild.interface}`,
      tree: virtualChild,
    })
  })

  return (
    <WrappedComponent
      component={tree.interface}
      componentProps={tree.props ?? {}}
      treePath={treePath}
      hydration={hydration}
      runtime={runtime}
      key={key}
    >
      {children ?? null}
    </WrappedComponent>
  )
}

const VirtualComponent: FC<Props> = ({ virtual, props = {} }) => {
  const { treePath } = useTreePath()
  const runtime = useRuntime()

  const parsedTree = useMemo(() => {
    const flatProps = flatObj(props)
    return transformLeaves<VirtualTree>(virtual, ({ value }) => {
      if (typeof value !== 'string') return

      const isDynamicValue = value.startsWith('$')
      if (!isDynamicValue) return

      const propKey = value.slice(1)
      if (!(propKey in flatProps)) return

      return flatProps[propKey]
    })
  }, [props, virtual])

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

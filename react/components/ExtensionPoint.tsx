import { mergeDeepRight, reduce } from 'ramda'
import React, { FC, Fragment } from 'react'

import ExtensionPointComponent from './ExtensionPointComponent'
import Loading from './Loading'
import { useRuntime } from './RenderContext'
import { useTreePath } from '../utils/treePath'
// import TrackEventsWrapper from './TrackEventsWrapper'

interface Props {
  id: string
  key?: string
  params?: any
  query?: any
  treePath?: string
  blockProps?: object
}

function mountTreePath(currentId: string, parentTreePath: string) {
  if (parentTreePath === currentId) {
    return parentTreePath
  }
  return [parentTreePath, currentId].filter(id => !!id).join('/')
}

function getChildExtensions(runtime: RenderContext, treePath: string) {
  const extension = runtime.extensions && runtime.extensions[treePath]

  if (!extension || !extension.blocks) {
    return
  }

  return extension.blocks.map((child, i) => {
    const childTreePath = mountTreePath(child.extensionPointId, treePath)

    const childExtension =
      runtime.extensions && runtime.extensions[childTreePath]
    const childProps = childExtension ? childExtension.props : {}

    return (
      <ExtensionPoint
        key={`around-${treePath}-${i}`}
        id={child.extensionPointId}
        blockProps={childProps}
        treePath={treePath}
      />
    )
  })
}

function withOuterExtensions(
  after: string[],
  around: string[],
  before: string[],
  treePath: string,
  props: any,
  element: JSX.Element
) {
  const beforeElements = before.map(beforeId => (
    <ExtensionPoint
      id={beforeId}
      key={beforeId}
      treePath={treePath}
      params={props.params}
      query={props.query}
    />
  ))

  const afterElements = after.map(afterId => (
    <ExtensionPoint
      id={afterId}
      key={afterId}
      treePath={treePath}
      params={props.params}
      query={props.query}
    />
  ))
  const wrapped = (
    <Fragment key={`wrapped-${treePath}`}>
      {beforeElements}
      {element}
      {afterElements}
    </Fragment>
  )

  return around.reduce((acc, aroundId) => {
    return (
      <ExtensionPoint
        {...props}
        id={aroundId}
        key={aroundId}
        treePath={treePath}
      >
        {acc}
      </ExtensionPoint>
    )
  }, wrapped)
}

const ExtensionPoint: FC<Props> = props => {
  const runtime = useRuntime()

  const treePathFromHook = useTreePath()

  const { children, params, query, id, blockProps, ...parentProps } = props

  const newTreePath = React.useMemo(
    () => mountTreePath(id, props.treePath || treePathFromHook.treePath),
    [id, props.treePath, treePathFromHook.treePath]
  )

  const extension = React.useMemo(() => {
    return runtime.extensions && runtime.extensions[newTreePath]
  }, [newTreePath, runtime.extensions])

  const {
    component = null,
    after = [],
    around = [],
    before = [],
    content = {},
    props: extensionProps = {},
    // track = [],
  } = extension || {}

  const mergedProps = React.useMemo(() => {
    return reduce(mergeDeepRight, {}, [
      /** Extra props passed to the ExtensionPoint component
       * e.g. <ExtensionPoint foo="bar" />
       */
      parentProps,
      /** Props that are read from runtime.extensions, that come from the blocks files
       */
      extensionProps,
      /** Props from the blockProps prop, used when the user wants to prevent overriding
       * the native ExtensionPoint props (such as `id`)
       */
      blockProps || {},
      content,
      { params, query },
    ])
  }, [parentProps, extensionProps, blockProps, content, params, query])

  const isCompositionChildren =
    extension && extension.composition === 'children'

  const componentChildren =
    isCompositionChildren && extension.blocks
      ? getChildExtensions(runtime, newTreePath)
      : children

  const extensionPointComponent = withOuterExtensions(
    after,
    around,
    before,
    newTreePath,
    mergedProps,
    component ? (
      <ExtensionPointComponent
        component={component}
        props={mergedProps}
        runtime={runtime}
        treePath={newTreePath}
      >
        {componentChildren}
      </ExtensionPointComponent>
    ) : (
      <Loading extension={extension} />
    )
  )

  return extensionPointComponent
}

ExtensionPoint.defaultProps = {
  blockProps: {},
  treePath: '',
}

export default ExtensionPoint

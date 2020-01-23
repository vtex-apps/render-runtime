import { mergeDeepRight, reduce } from 'ramda'
import React, { FC, Fragment } from 'react'

import ExtensionPointComponent from './ExtensionPointComponent'
import Loading from './Loading'
import { useRuntime } from './RenderContext'
import { useTreePath } from '../utils/treePath'
import NoSSR from './NoSSR'
import { withErrorBoundary } from './ErrorBoundary'
import GenericPreview from './Preview/GenericPreview'
import LoadingBar from './LoadingBar'

interface Props {
  id: string
  key?: string
  params?: any
  query?: any
  preview?: boolean
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

  // This filter condition is for backwards compatibility
  return extension.blocks
    .filter(block => block.children === undefined || block.children === true)
    .map((child, i) => {
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

  const isRootTreePath = treePath.indexOf('/') === -1

  const wrapped = (
    <Fragment key={`wrapped-${treePath}`}>
      {beforeElements}
      {element}
      {isRootTreePath && <div className="flex flex-grow-1" />}
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
        beforeElements={beforeElements}
        afterElements={afterElements}
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
    render: renderStrategy = null,
    props: extensionProps = {},
  } = extension || {}

  const mergedProps = React.useMemo(() => {
    return reduce(mergeDeepRight, {} as any, [
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

  if (
    /* Stops rendering if the extension is not found. Useful for optional ExtensionPoints */
    !extension
  ) {
    return null
  }

  const isCompositionChildren =
    extension && extension.composition === 'children'

  const componentChildren =
    isCompositionChildren && extension.blocks
      ? getChildExtensions(runtime, newTreePath)
      : children

  const isRootTreePath = newTreePath.indexOf('/') === -1

  const extensionPointComponent = withOuterExtensions(
    after,
    around,
    before,
    newTreePath,
    mergedProps,

    <ExtensionPointComponent
      component={component}
      props={mergedProps}
      runtime={runtime}
      treePath={newTreePath}
    >
      {component ? (
        componentChildren
      ) : isRootTreePath ? (
        <GenericPreview />
      ) : (
        <Loading />
      )}
    </ExtensionPointComponent>
  )

  // "client" component assets are sent to server side rendering,
  // but they should display a loading animation.
  //
  // "lazy" components might never be used, so they don't necessarily
  // need a loading animation.
  return (
    <Fragment>
      {runtime.preview && isRootTreePath && <LoadingBar />}
      {renderStrategy === 'client' && !runtime.amp ? (
        <NoSSR onSSR={<Loading />}>{extensionPointComponent}</NoSSR>
      ) : (
        extensionPointComponent
      )}
    </Fragment>
  )
}

ExtensionPoint.defaultProps = {
  blockProps: {},
  treePath: '',
}

export default withErrorBoundary(ExtensionPoint)

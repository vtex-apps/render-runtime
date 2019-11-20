import { mergeDeepRight, reduce } from 'ramda'
import React, { FC, Fragment } from 'react'
import {
  defineMessages,
  injectIntl,
  InjectedIntl,
  InjectedIntlProps,
} from 'react-intl'
import { EmptyState, Button } from 'vtex.styleguide'

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

const messages = defineMessages({
  offlineTitle: {
    id: 'offline-warning.title',
    defaultMessage: '',
  },
  offlineMessage: {
    id: 'offline-warning.message',
    defaultMessage: '',
  },
  offlineButton: {
    id: 'offline-warning.button',
  },
})

function mountTreePath(currentId: string, parentTreePath: string) {
  if (parentTreePath === currentId) {
    return parentTreePath
  }
  return [parentTreePath, currentId].filter(id => !!id).join('/')
}

function getChildExtensions(
  runtime: RenderContext,
  treePath: string,
  intl: InjectedIntl
) {
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
        intl={intl}
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
  preview: boolean,
  intl: InjectedIntl,
  element: JSX.Element
) {
  const beforeElements = before.map(beforeId => (
    <ExtensionPoint
      id={beforeId}
      key={beforeId}
      treePath={treePath}
      params={props.params}
      query={props.query}
      intl={intl}
    />
  ))

  const afterElements = after.map(afterId => (
    <ExtensionPoint
      id={afterId}
      key={afterId}
      treePath={treePath}
      params={props.params}
      query={props.query}
      intl={intl}
    />
  ))

  const isRootTreePath = treePath.indexOf('/') === -1

  const isOffline = window && window.navigator && !window.navigator.onLine

  const handleReload = () => {
    window.location.reload()
  }

  const offlineWarning = (
    <EmptyState title={intl.formatMessage(messages.offlineTitle)}>
      <p>{intl.formatMessage(messages.offlineMessage)}</p>
      <div className="pt5">
        <Button variation="secondary" size="small" onClick={handleReload}>
          <span className="flex align-baseline">
            {intl.formatMessage(messages.offlineButton)}
          </span>
        </Button>
      </div>
    </EmptyState>
  )

  const fallbackContent = isOffline ? offlineWarning : <GenericPreview />

  const wrapped = (
    <Fragment key={`wrapped-${treePath}`}>
      {beforeElements}
      {isRootTreePath && preview ? fallbackContent : element}
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

const ExtensionPoint: FC<Props & InjectedIntlProps> = props => {
  const runtime = useRuntime()

  const treePathFromHook = useTreePath()

  const {
    children,
    params,
    query,
    id,
    blockProps,
    intl,
    ...parentProps
  } = props

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
      ? getChildExtensions(runtime, newTreePath, intl)
      : children

  const isRootTreePath = newTreePath.indexOf('/') === -1

  const extensionPointComponent = withOuterExtensions(
    after,
    around,
    before,
    newTreePath,
    mergedProps,
    runtime.preview,
    intl,
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

  if (runtime.preview && isRootTreePath) {
    return (
      <Fragment>
        <LoadingBar />
        {extensionPointComponent}
      </Fragment>
    )
  }

  // "client" component assets are sent to server side rendering,
  // but they should display a loading animation.
  //
  // "lazy" components might never be used, so they don't necessarily
  // need a loading animation.
  return renderStrategy === 'client' && !runtime.amp ? (
    <NoSSR onSSR={<Loading />}>{extensionPointComponent}</NoSSR>
  ) : (
    extensionPointComponent
  )
}

ExtensionPoint.defaultProps = {
  blockProps: {},
  treePath: '',
}

export default withErrorBoundary(injectIntl(ExtensionPoint))

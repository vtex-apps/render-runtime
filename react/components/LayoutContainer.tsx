import React, { FunctionComponent } from 'react'
import { useTreePath } from '../utils/treePath'
import ExtensionPoint from './ExtensionPoint'
import { useRuntime } from './RenderContext'
import { LoadingWrapper } from './LoadingContext'
import { LazyImages } from './LazyImages'
import FoldableContainer from './FoldableContainer'
import { isSiteEditorIframe } from '../utils/dom'
import { Route } from '../typings/runtime'

type Element = string | ElementArray
type ElementArray = Element[]

interface LayoutContainerProps {
  aboveTheFold?: number
  elements: Element
}

interface ContainerProps {
  aboveTheFold?: number
  elements: Element
  isRow: boolean
  isMobile?: boolean
  preview?: boolean
  route?: Route
}

const Container: FunctionComponent<ContainerProps> = ({
  aboveTheFold,
  elements,
  isRow,
  isMobile,
  preview,
  children,
  route,
  ...props
}) => {
  const className = `flex flex-grow-1 w-100 ${
    isRow ? 'flex-row' : 'flex-column'
  }`

  if (typeof elements === 'string') {
    if (elements === '__children__') {
      return <>{children}</>
    }

    const elementIdRegex = /#(.*)/
    const elementId = elements.match(elementIdRegex)
    const containerClass = !elements.includes('fold')
      ? `vtex-render__container-id-${elementId ? elementId[1] : elements}`
      : ''
    return (
      <div className={isRow ? containerClass : className}>
        <ExtensionPoint id={elements} {...props} />
      </div>
    )
  }

  let foldIndex = elements.indexOf('__fold__')
  if (foldIndex === -1) {
    foldIndex = elements.indexOf(`__fold__.${isMobile ? 'mobile' : 'desktop'}`)
  }

  const hasFold = foldIndex > -1

  const lazyImagesFoldPosition = elements.indexOf(
    '__fold__.experimentalLazyImages'
  )
  const hasLazyImagesFold = lazyImagesFoldPosition > -1

  // TODO: Seems to be legacy and unused, might be removed in the future
  let elementsToRender = elements.length
  if (preview && aboveTheFold != null) {
    elementsToRender = aboveTheFold
  }

  const wrappedElements: JSX.Element[] = elements
    .slice(0, elementsToRender)
    .map((element: Element, i: number) => {
      let container = (
        <Container
          key={element.toString()}
          elements={element}
          isMobile={isMobile}
          isRow={!isRow}
          {...props}
        >
          {children}
        </Container>
      )

      if (hasLazyImagesFold && i > lazyImagesFoldPosition) {
        container = (
          <LazyImages key={element.toString()}>{container}</LazyImages>
        )
      }

      return container
    })

  if (!hasFold || isSiteEditorIframe || route?.path?.includes('__siteEditor')) {
    return <div className={className}>{wrappedElements}</div>
  }

  return (
    <div className={className}>
      <FoldableContainer foldIndex={foldIndex}>
        {wrappedElements}
      </FoldableContainer>
    </div>
  )
}

const LayoutContainer: React.FunctionComponent<LayoutContainerProps> = (
  props
) => {
  const { extensions, preview, hints, route } = useRuntime()
  const { treePath } = useTreePath()

  const extension = extensions[treePath]

  const elements =
    extension?.blocks?.map?.((insertion) => insertion.extensionPointId) ?? []
  const containerProps = { ...props, elements }

  const container = (
    <Container
      {...containerProps}
      preview={preview}
      isRow={false}
      isMobile={hints.mobile}
      route={route}
    />
  )

  const isRootTreePath = treePath.indexOf('/') === -1

  if (extension?.preview && isRootTreePath) {
    /** TODO: LoadingWrapper is in the end a makeshift Suspense.
     * Should probably be replaced in the future. */
    return <LoadingWrapper>{container}</LoadingWrapper>
  }

  return container
}

export default LayoutContainer

import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { useTreePath } from '../utils/treePath'
import ExtensionPoint from './ExtensionPoint'
import { useRuntime } from './RenderContext'
import { LoadingWrapper } from './LoadingContext'
import { LazyImages } from './LazyImages'

type Element = string | ElementArray
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ElementArray extends Array<Element> {}

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
}

interface ContainerState {
  shouldRenderBelowTheFold: boolean
}

const elementPropType = PropTypes.oneOfType([PropTypes.string, PropTypes.array])
  .isRequired

class Container extends Component<ContainerProps, ContainerState> {
  public static propTypes = {
    aboveTheFold: PropTypes.number,
    elements: elementPropType,
    isRow: PropTypes.bool,
    isMobile: PropTypes.bool,
    preview: PropTypes.bool,
  }

  public state = {
    shouldRenderBelowTheFold: false,
  }

  private hasFold: boolean
  private foldIndex: number
  private hasLazyImagesFold: boolean
  private lazyImagesFoldPosition: number

  constructor(props: ContainerProps) {
    super(props)

    const { elements, isMobile } = props

    this.foldIndex = elements.indexOf('__fold__')
    if (this.foldIndex === -1) {
      this.foldIndex = elements.indexOf(
        `__fold__.${isMobile ? 'mobile' : 'desktop'}`
      )
    }

    this.hasFold = this.foldIndex > -1

    this.lazyImagesFoldPosition = elements.indexOf(
      '__fold__.experimentalLazyImages'
    )
    this.hasLazyImagesFold = this.lazyImagesFoldPosition > -1
  }

  private handleScroll = () => {
    if (!this.state.shouldRenderBelowTheFold) {
      this.setState({
        shouldRenderBelowTheFold: true,
      })
    }

    window.document.removeEventListener('scroll', this.handleScroll)
  }

  public componentDidMount() {
    if (this.hasFold) {
      window &&
        window.document &&
        window.document.addEventListener('scroll', this.handleScroll)
    }
  }

  public componentWillUnmount() {
    if (this.hasFold) {
      window &&
        window.document &&
        window.document.removeEventListener('scroll', this.handleScroll)
    }
  }

  public render() {
    const { isRow, isMobile, elements, children, ...props } = this.props

    const { shouldRenderBelowTheFold } = this.state

    const className = `flex flex-grow-1 w-100 ${
      isRow ? 'flex-row' : 'flex-column'
    }`
    if (typeof elements === 'string') {
      if (elements === '__children__') {
        return children
      }
      return (
        <div className={isRow ? '' : className}>
          <ExtensionPoint id={elements} {...props} />
        </div>
      )
    }

    let elementsToRender = this.props.elements.length
    if (this.props.preview && this.props.aboveTheFold != null) {
      elementsToRender = this.props.aboveTheFold
    }

    if (this.hasFold && !shouldRenderBelowTheFold) {
      elementsToRender = this.foldIndex
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

        if (this.hasLazyImagesFold && i > this.lazyImagesFoldPosition) {
          container = (
            <LazyImages key={element.toString()}>{container}</LazyImages>
          )
        }

        return container
      })

    return (
      <div className={className}>
        {wrappedElements}

        {/* Forces scrolling if there is below-the-fold content to be rendered */}
        {this.hasFold && !shouldRenderBelowTheFold && (
          <div style={{ height: '200vh' }} />
        )}
      </div>
    )
  }
}

const LayoutContainer: React.FunctionComponent<LayoutContainerProps> = (
  props
) => {
  const { extensions, preview, hints } = useRuntime()
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

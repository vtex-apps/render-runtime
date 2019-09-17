import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { useTreePath } from '../utils/treePath'
import ExtensionPoint from './ExtensionPoint'
import { useRuntime } from './RenderContext'

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

  private state = {
    shouldRenderBelowTheFold: false,
  }

  private handleScroll = () => {
    this.setState({
      shouldRenderBelowTheFold: true,
    })

    window.document.removeEventListener('scroll', this.handleScroll)
  }

  public componentDidMount() {
    window &&
      window.document &&
      window.document.addEventListener('scroll', this.handleScroll)
  }

  public componentWillUnmount() {
    window &&
      window.document &&
      window.document.removeEventListener('scroll', this.handleScroll)
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

    let foldIndex = elements.indexOf('__fold__')
    if (foldIndex === -1) {
      foldIndex = elements.indexOf(
        `__fold__.${isMobile ? 'mobile' : 'desktop'}`
      )
    }

    if (foldIndex > -1 && !shouldRenderBelowTheFold) {
      elementsToRender = foldIndex
    }

    const returnValue: JSX.Element[] = elements
      .slice(0, elementsToRender)
      .map((element: Element) => {
        return (
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
      })

    return <div className={className}>{returnValue}</div>
  }
}

const LayoutContainer: React.FunctionComponent<
  LayoutContainerProps
> = props => {
  const { extensions, preview, hints } = useRuntime()
  const { treePath } = useTreePath()

  const extension = extensions[treePath]
  const elements =
    (extension &&
      extension.blocks &&
      extension.blocks.map(insertion => insertion.extensionPointId)) ||
    []
  const containerProps = { ...props, elements }

  return (
    <Container
      {...containerProps}
      preview={preview}
      isRow={false}
      isMobile={hints.mobile}
    />
  )
}

export default LayoutContainer

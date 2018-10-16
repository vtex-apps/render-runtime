import PropTypes from 'prop-types'
import React, { Component } from 'react'

import ExtensionPoint from './ExtensionPoint'

type Element = string | ElementArray
interface ElementArray extends Array<Element> {}

interface LayoutContainerProps {
  aboveTheFold?: number
  elements: Element
}

interface ContainerProps {
  aboveTheFold?: number
  elements: Element
  isRow: boolean
}

interface ContainerState {
  elementsToRender: number
}

const elementPropType = PropTypes.oneOfType([PropTypes.string, PropTypes.array]).isRequired

class Container extends Component<ContainerProps, ContainerState> {
  public static propTypes = {
    aboveTheFold: PropTypes.number,
    elements: elementPropType,
    isRow: PropTypes.bool
  }

  public constructor(props: ContainerProps) {
    super(props)
    const { aboveTheFold } = this.props
    this.state = {
      elementsToRender: aboveTheFold != null
        ? aboveTheFold
        : this.props.elements.length
    }
  }

  public componentDidMount() {
    this.setState({ elementsToRender: this.props.elements.length })
  }

  public render() {
    const { isRow, elements, children, aboveTheFold, ...props } = this.props

    const className = `flex flex-grow-1 w-100 ${isRow ? 'flex-row' : 'flex-column'}`
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

    const returnValue: JSX.Element[] = elements.slice(0, this.state.elementsToRender).map((element: Element) => {
      return (
        <Container key={element.toString()} elements={element} isRow={!isRow} {...props}>
          {children}
        </Container>
      )
    })

    return (
      <div className={className}>
        {returnValue}
      </div>
    )
  }
}

// tslint:disable-next-line
class LayoutContainer extends Component<LayoutContainerProps> {
  public static propTypes = {
    aboveTheFold: PropTypes.number,
    elements: elementPropType,
  }

  public render() {
    return <Container {...this.props} isRow={false} />
  }
}

export default LayoutContainer

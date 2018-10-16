import { canUseDOM } from 'exenv'
import PropTypes from 'prop-types'
import React, { Component } from 'react'

import ExtensionPoint from './ExtensionPoint'

type Element = string | any[]

interface LayoutContainerProps {
  aboveTheFold?: number
  elements: Element[]
}

interface ContainerProps {
  aboveTheFold?: number
  elements: Element
  isRow: boolean
}

const elementPropType = PropTypes.oneOfType([PropTypes.string, PropTypes.array]).isRequired

class Container extends Component<ContainerProps> {
  public static propTypes = {
    aboveTheFold: PropTypes.number,
    elements: elementPropType,
    isRow: PropTypes.bool
  }

  public constructor(props: ContainerProps) {
    super(props)

    this.state = {
      aboveTheFold: props.aboveTheFold
    }
  }

  public render() {
    const { isRow, elements, children, ...props } = this.props

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

    const returnValue: JSX.Element[] = elements.map((element: Element) => {
      return (
        <Container key={element.toString()} elements={element} isRow={!isRow} {...props} >
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

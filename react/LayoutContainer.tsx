import PropTypes from 'prop-types'
import React, { Component, Fragment } from 'react'

import ExtensionPoint from './ExtensionPoint'

type Element = string | any[]

interface LayoutContainerProps {
  elements: Element[]
}

interface ContainerProps {
  elements: Element
  isRow: boolean
}

const elementPropType = PropTypes.arrayOf(
  PropTypes.oneOfType([PropTypes.string, PropTypes.array])
).isRequired

class Container extends Component<ContainerProps> {
  public static propTypes = {
    elements: elementPropType,
    isRow: PropTypes.bool
  }

  public render() {
    const { isRow, elements, ...props } = this.props

    const className = `flex flex-grow-1 w-100 ${isRow ? 'flex-row' : 'flex-column'}`
    if (typeof elements === 'string') {
      if (elements === '__children__') {
        return this.props.children
      }
      return (
        <div className={isRow ? '' : className}>
          <ExtensionPoint id={elements} {...props} />
        </div>
      )
    }

    const returnValue: JSX.Element[] = elements.map((element: Element) => {
      return (
        <Container elements={element} isRow={!isRow} {...props} >
          {this.props.children}
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
    elements: elementPropType
  }

  public render() {
    return <Container {...this.props} isRow={false}>{this.props.children}</Container>
  }
}

export default LayoutContainer

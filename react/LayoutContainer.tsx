import PropTypes from 'prop-types'
import React, { Component, CSSProperties } from 'react'

import ExtensionPoint from './ExtensionPoint'

type Element = string | Array<any>

interface LayoutContainerProps {
  elements: Array<Element>
}

interface ContainerProps {
  elements: Element
  isRow: boolean
}

const elementPropType = PropTypes.arrayOf(
  PropTypes.oneOfType([PropTypes.string, PropTypes.array])
).isRequired

class Container extends Component<ContainerProps> {
  static propTypes = {
    elements: elementPropType,
    isRow: PropTypes.bool
  }

  public render() {
    const { isRow, elements } = this.props

    const className = `flex flex-grow-1 w-100 ${isRow ? "flex-row" : "flex-column"}`
    if (typeof elements === "string") {
      return (
        <div className={isRow ? "" : className}>
          <ExtensionPoint id={elements} />
        </div>
      )
    }

    const returnValue: Array<JSX.Element> = elements.map((element: Element) => {
      return <Container elements={element} isRow={!isRow} />
    })

    return (
      <div className={className}>
        {returnValue}
      </div>
    )
  }
}

class LayoutContainer extends Component<LayoutContainerProps> {
  static propTypes = {
    elements: elementPropType
  }

  public render() {
    const { elements } = this.props

    return <Container elements={elements} isRow={false} />
  }
}

export default LayoutContainer

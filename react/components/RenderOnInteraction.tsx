import React, { Component } from 'react'
import { canUseDOM } from 'exenv'

class RenderOnInteraction extends Component {
  state = {
    canRender: false,
    count: 0,
  }

  shouldComponentUpdate() {
    const shouldUpdate = !canUseDOM || this.state.canRender
    if (!shouldUpdate) {
      console.log('teste BLOCKING UPDATE!')
    }
    console.log('teste returning: ', shouldUpdate)
    return shouldUpdate
  }

  changeCanRender() {
    console.log('teste change can render!')
    this.setState({ canRender: true, count: this.state.count + 1 })
  }

  render() {
    console.log('teste state:', this.state)
    if (!this.state.canRender) {
      console.log('teste RENDER STATIC:', this.state)
      return (
        <div
          className={`teste-static-${this.state.count}`}
          onMouseEnter={this.changeCanRender}
        >
          {this.props.children}
        </div>
      )
    }
    console.log('teste count:', this.state.count)
    return this.props.children
  }
}

export default RenderOnInteraction

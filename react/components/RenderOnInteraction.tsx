import React, { Component } from 'react'
import { canUseDOM } from 'exenv'

class RenderOnInteraction extends Component {
  state = {
    canRender: false,
  }

  shouldComponentUpdate() {
    return canUseDOM || this.state.canRender
  }

  changeCanRender() {
    this.setState({ canRender: true })
  }

  render() {
    if (!this.state.canRender) {
      return (
        <div onMouseEnter={this.changeCanRender}>{this.props.children}</div>
      )
    }
    return this.props.children
  }
}

export default RenderOnInteraction

import { Component } from 'react'
import { canUseDOM } from 'exenv'

class RenderClientOnly extends Component {
  shouldComponentUpdate() {
    return canUseDOM
  }

  render() {
    return this.props.children
  }
}

export default RenderClientOnly

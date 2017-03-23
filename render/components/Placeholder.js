import React, {Component, PropTypes} from 'react'
import treePath from 'react-tree-path'

const EMPTY_OBJECT = {}
const empty = <span className="Placeholder--empty"></span>

// eslint-disable-next-line
class Placeholder extends Component {
  render () {
    const {placeholders} = this.context
    const {treePath} = this.props
    const {Component, settings} = placeholders[treePath] || EMPTY_OBJECT

    return Component
      ? <Component {...settings} />
      : <div>{this.props.children}</div> || empty
  }
}

Placeholder.propTypes = {
  id: PropTypes.string.isRequired,
  children: PropTypes.node,
  implementation: PropTypes.func,
  settings: PropTypes.object,
  treePath: PropTypes.string,
}

Placeholder.contextTypes = {
  placeholders: PropTypes.object,
}

export default treePath(Placeholder)

import React, {Component, PropTypes} from 'react'
import treePath from 'react-tree-path'

const EMPTY_OBJECT = {}
const empty = <span className="Placeholder--empty"></span>

// eslint-disable-next-line
class Placeholder extends Component {
  render () {
    // TODO: must find a better way to add found placeholders to RenderProvider
    const {placeholders} = global.__RUNTIME__
    const {treePath} = this.props
    const {Component} = placeholders[treePath] || EMPTY_OBJECT
    const {params, settings} = global.__RUNTIME__.placeholders[treePath] || EMPTY_OBJECT
    const {query} = global.__RUNTIME__
    const props = {
      params,
      query,
      settings,
    }
    return Component
      ? <Component {...props} />
      : this.props.children
        ? <div>{this.props.children}</div>
        : empty
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

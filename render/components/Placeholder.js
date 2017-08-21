import React, {Component} from 'react'
import PropTypes from 'prop-types'
import treePath from 'react-tree-path'

const empty = <span className="Placeholder--empty"></span>

class Placeholder extends Component {
  constructor (props, context) {
    super()

    const {treePath} = props

    const {placeholders} = context

    this._handlePlaceholderUpdate = this._handlePlaceholderUpdate.bind(this)

    this.state = {
      placeholder: placeholders[treePath],
    }
  }

  render () {
    const {placeholder} = this.state

    if (!placeholder) {
      return (
        this.props.children
        ? <div>{this.props.children}</div>
        : empty
      )
    }

    const {query} = global.__RUNTIME__

    const {Component, params, settings} = placeholder

    const props = {
      params,
      query,
      settings,
    }

    return (
      Component
      ? <Component {...props} />
      : empty
    )
  }

  _handlePlaceholderUpdate () {
    const {treePath} = this.props
    const {placeholders} = this.context
    this.setState({
      placeholder: placeholders[treePath],
    })
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.treePath !== this.props.treePath) {
      const {treePath} = nextProps
      const {placeholders} = this.context
      this.setState({
        placeholder: placeholders[treePath],
      })
    }
  }

  componentDidMount () {
    const {placeholder} = this.state
    placeholder && global.__RUNTIME__.eventEmitter.addListener(`placeholder:${placeholder.name}:update`, this._handlePlaceholderUpdate)
  }

  componentWillUnmount () {
    const {placeholder} = this.state
    placeholder && global.__RUNTIME__.eventEmitter.removeListener(`placeholder:${placeholder.name}:update`, this._handlePlaceholderUpdate)
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

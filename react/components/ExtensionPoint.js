import React, {Component} from 'react'
import PropTypes from 'prop-types'
import treePath from 'react-tree-path'

const empty = <span className="ExtensionPoint--empty" />

class ExtensionPoint extends Component {
  constructor(props, context) {
    super()

    const {treePath} = props

    const {placeholders} = context

    this._handleExtensionPointUpdate = this._handleExtensionPointUpdate.bind(this)

    this.state = {
      placeholder: placeholders[treePath],
    }
  }

  render() {
    const {placeholder} = this.state

    const {children, fallbackComponent, ...other} = this.props

    if (!placeholder) {
      return fallbackComponent ? <div>{fallbackComponent}</div> : empty
    }

    const {query} = global.__RUNTIME__

    const {Component, params, settings} = placeholder

    const props = {
      params,
      query,
      settings,
      ...other,
    }

    return Component ? <Component {...props}>{children}</Component> : empty
  }

  _handleExtensionPointUpdate() {
    const {treePath} = this.props
    const {placeholders} = this.context
    this.setState({
      placeholder: placeholders[treePath],
    })
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.treePath !== this.props.treePath) {
      const {treePath} = nextProps
      const {placeholders} = this.context
      this.setState({
        placeholder: placeholders[treePath],
      })
    }
  }

  componentDidMount() {
    const {placeholder} = this.state
    const {production, eventEmitter} = global.__RUNTIME__
    !production &&
      placeholder &&
      eventEmitter.addListener(
        `placeholder:${placeholder.name}:update`,
        this._handleExtensionPointUpdate,
      )
  }

  componentWillUnmount() {
    const {placeholder} = this.state
    const {production, eventEmitter} = global.__RUNTIME__
    !production &&
      placeholder &&
      eventEmitter.removeListener(
        `placeholder:${placeholder.name}:update`,
        this._handleExtensionPointUpdate,
      )
  }
}

ExtensionPoint.propTypes = {
  id: PropTypes.string.isRequired,
  children: PropTypes.node,
  implementation: PropTypes.func,
  settings: PropTypes.object,
  treePath: PropTypes.string,
}

ExtensionPoint.contextTypes = {
  placeholders: PropTypes.object,
}

export default treePath(ExtensionPoint)

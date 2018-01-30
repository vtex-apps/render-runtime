import React, {Component} from 'react'
import PropTypes from 'prop-types'
import treePath from 'react-tree-path'

const empty = <span className="ExtensionPoint--empty" />

class ExtensionPoint extends Component {
  constructor(props, context) {
    super()

    const {treePath} = props

    const {extensions} = context

    this._handleExtensionPointUpdate = this._handleExtensionPointUpdate.bind(this)

    this.state = {
      extension: extensions[treePath],
    }
  }

  render() {
    const {pages} = this.context
    const {extension} = this.state
    const {children, treePath, ...other} = this.props

    if (!extension) {
      return empty
    }

    const {query} = global.__RUNTIME__

    const params = pages[treePath] && pages[treePath].params
    const {component, props: extensionProps} = extension
    const Component = global.__RENDER_6_COMPONENTS__[component]

    const props = {
      params,
      query,
      ...extensionProps,
      ...other,
    }

    return Component ? <Component {...props}>{children}</Component> : empty
  }

  _handleExtensionPointUpdate() {
    const {treePath} = this.props
    const {extensions} = this.context
    this.setState({
      extension: extensions[treePath],
    })
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.treePath !== this.props.treePath) {
      const {treePath} = nextProps
      const {extensions} = this.context
      this.setState({
        extension: extensions[treePath],
      })
    }
  }

  componentDidMount() {
    const {extension} = this.state
    const {treePath} = this.props
    const {production, eventEmitter} = global.__RUNTIME__
    !production &&
      extension &&
      eventEmitter.addListener(
        `component:${extension.component}:update`,
        this._handleExtensionPointUpdate,
      ).addListener(
        `extension:${treePath}:update`,
        this._handleExtensionPointUpdate,
      ).addListener(
        'extension:*:update',
        this._handleExtensionPointUpdate,
      )
  }

  componentWillUnmount() {
    const {extension} = this.state
    const {treePath} = this.props
    const {production, eventEmitter} = global.__RUNTIME__
    !production &&
      extension &&
      eventEmitter.removeListener(
        `component:${extension.component}:update`,
        this._handleExtensionPointUpdate,
      ).removeListener(
        `extension:${treePath}:update`,
        this._handleExtensionPointUpdate,
      ).removeListener(
        'extension:*:update',
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
  extensions: PropTypes.object,
  pages: PropTypes.object,
  page: PropTypes.string,
}

export default treePath(ExtensionPoint)

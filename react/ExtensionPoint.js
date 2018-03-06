import React, {Component} from 'react'
import PropTypes from 'prop-types'
import treePath from 'react-tree-path'

import ExtensionPointComponent from './components/ExtensionPointComponent'

class ExtensionPoint extends Component {
  static contextTypes = {
    extensions: PropTypes.object,
    emitter: PropTypes.object,
    production: PropTypes.bool,
  }

  static propTypes = {
    children: PropTypes.node,
    treePath: PropTypes.string.isRequired,
    params: PropTypes.object,
    query: PropTypes.object,
  }

  constructor(props, context) {
    super(props, context)
    this.state = this.getExtensionPointState(props.treePath, context.extensions)
  }

  getExtensionPointState = (treePath, extensions) => {
    const extension = extensions[treePath]
    return {
      component: extension ? extension.component : null,
      props: extension ? extension.props : null,
    }
  }

  updateExtensionPoint = (state) => {
    if (state && state.extensions) {
      this.context.extensions = state.extensions
    }
    this.setState(this.getExtensionPointState(this.props.treePath, this.context.extensions))
  }

  subscribeToTreePath = (treePath) => {
    const {emitter} = this.context
    emitter.addListener(`extension:${treePath}:update`, this.updateExtensionPoint)
  }

  unsubscribeToTreePath = (treePath) => {
    const {emitter} = this.context
    emitter.removeListener(`extension:${treePath}:update`, this.updateExtensionPoint)
  }

  componentDidMount() {
    const {production} = this.context
    const {treePath} = this.props

    if (!production) {
      this.subscribeToTreePath('*')
      this.subscribeToTreePath(treePath)
    }
  }

  componentWillReceiveProps(nextProps) {
    const {production} = this.context

    if (nextProps.treePath !== this.props.treePath) {
      if (!production) {
        this.unsubscribeToTreePath(this.props.treePath)
        this.subscribeToTreePath(nextProps.treePath)
      }

      this.setState(this.getExtensionPointState(nextProps.treePath, this.context.extensions))
    }
  }

  componentWillUnmount() {
    const {production} = this.context
    const {treePath} = this.props

    if (!production) {
      this.unsubscribeToTreePath('*')
      this.unsubscribeToTreePath(treePath)
    }
  }

  render() {
    const {children, params, query, ...parentProps} = this.props
    const {component, props: extensionProps} = this.state

    delete parentProps.id

    const props = {
      ...parentProps,
      ...extensionProps,
      params,
      query,
    }

    return <ExtensionPointComponent component={component} props={props}>{children}</ExtensionPointComponent>
  }
}

export default treePath(ExtensionPoint)

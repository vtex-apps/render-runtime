import React, {Component} from 'react'
import PropTypes from 'prop-types'

import {getImplementation} from '../utils/assets'

export default class ExtensionPointComponent extends Component {
  static contextTypes = {
    extensions: PropTypes.object,
    emitter: PropTypes.object,
    treePath: PropTypes.string,
    fetchComponent: PropTypes.func,
  }

  static propTypes = {
    children: PropTypes.node,
    component: PropTypes.string,
    props: PropTypes.object,
    production: PropTypes.bool,
  }

  constructor(props, context) {
    super(props, context)

    const root = context.treePath.split('/')[0]
    this.emptyExtensionPoint = context.extensions[`${root}/__empty`]
    this.editableExtensionPoint = context.extensions[`${root}/__editable`]
  }

  updateComponents = () => {
    this.forceUpdate()
  }

  fetchAndRerender = () => {
    const {fetchComponent} = this.context
    const {component} = this.props
    const Component = getImplementation(component)

    // Let's fetch the assets and re-render.
    if (component && !Component) {
      fetchComponent(component).then(this.updateComponents)
    }
  }

  subscribeToComponent = (c) => {
    const {emitter} = this.context
    emitter.addListener(`component:${c}:update`, this.updateComponents)
  }

  unsubscribeToComponent = (c) => {
    const {emitter} = this.context
    emitter.removeListener(`component:${c}:update`, this.updateComponents)
  }

  componentDidMount() {
    const {component} = this.props
    this.subscribeToComponent(component)
    this.fetchAndRerender()

    if (this.emptyExtensionPoint && this.editableExtensionPoint) {
      this.subscribeToComponent(this.emptyExtensionPoint.component)
      this.subscribeToComponent(this.editableExtensionPoint.component)
    }
  }

  componentWillReceiveProps(nextProps) {
    const {component} = this.props
    const {component: nextComponent} = nextProps

    this.unsubscribeToComponent(component)
    this.subscribeToComponent(nextComponent)
    this.updateComponents()
  }

  componentDidUpdate() {
    this.fetchAndRerender()
  }

  componentWillUnmount() {
    const {component} = this.props
    this.unsubscribeToComponent(component)

    if (this.emptyExtensionPoint && this.editableExtensionPoint) {
      this.unsubscribeToComponent(this.emptyExtensionPoint.component)
      this.unsubscribeToComponent(this.editableExtensionPoint.component)
    }
  }

  render() {
    const {treePath, production} = this.context
    const {component, props, children} = this.props
    const Component = getImplementation(component)

    const EmptyExtensionPoint = this.emptyExtensionPoint && getImplementation(this.emptyExtensionPoint.component)
    const EditableExtensionPoint = this.editableExtensionPoint && getImplementation(this.editableExtensionPoint.component)

    // This extension point is not configured.
    if (!component && !production && this.emptyExtensionPoint) {
      return <EditableExtensionPoint treePath={treePath} component={this.emptyExtensionPoint.component}><EmptyExtensionPoint /></EditableExtensionPoint>
    }

    const configuredComponent = Component ? <Component {...props}>{children}</Component> : children || null
    return this.editableExtensionPoint
      ? <EditableExtensionPoint treePath={treePath} component={component} props={props}>{configuredComponent}</EditableExtensionPoint>
      : configuredComponent
  }
}

import React, {Component} from 'react'
import PropTypes from 'prop-types'

import {fetchAssets, getImplementation} from '../utils/assets'

export default class ExtensionPointComponent extends Component {
  static contextTypes = {
    components: PropTypes.object,
    extensions: PropTypes.object,
    emitter: PropTypes.object,
    treePath: PropTypes.string,
  }

  static propTypes = {
    children: PropTypes.node,
    component: PropTypes.string,
    props: PropTypes.object,
    production: PropTypes.bool,
  }

  updateComponents = () => {
    this.forceUpdate()
  }

  fetchAndRerender = () => {
    const {components: componentAssets} = this.context
    const {component} = this.props
    const Component = getImplementation(component)

    // Let's fetch the assets and re-render.
    if (!Component) {
      fetchAssets(componentAssets[component]).then(this.updateComponents)
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
  }

  render() {
    const {treePath, production} = this.context
    const {component, props, children} = this.props
    const Component = getImplementation(component)

    const root = treePath.split('/')[0]
    const emptyExtensionPoint = this.context.extensions[`${root}/__empty`]
    const EmptyExtensionPoint = emptyExtensionPoint && getImplementation(emptyExtensionPoint.component)

    // This extension point is not configured.
    if (!component && !production) {
      return <EmptyExtensionPoint />
    }

    // This extension point's assets haven't loaded yet.
    if (!Component) {
      return children || null
    }

    return <Component {...props}>{children}</Component>
  }
}

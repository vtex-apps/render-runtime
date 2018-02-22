import React, {Component} from 'react'
import PropTypes from 'prop-types'

import {fetchAssets, getImplementations} from '../utils/assets'

export default class ExtensionPointComponent extends Component {
  static contextTypes = {
    components: PropTypes.object,
    emitter: PropTypes.object,
  }

  static propTypes = {
    children: PropTypes.node,
    components: PropTypes.array,
    props: PropTypes.object,
  }

  constructor(props) {
    super(props)
    this.state = {
      Components: getImplementations(props.components),
    }
  }

  updateComponents = () => {
    const {components} = this.props
    const Components = getImplementations(components)
    this.setState({Components})
  }

  fetchAndRerender = () => {
    const {components: componentAssets} = this.context
    const {components} = this.props
    const Components = getImplementations(components)

    // We have configured components but they aren't all loaded. Let's fetch the assets and re-render.
    if (Components.length < components.length) {
      fetchAssets(components, componentAssets).then(this.updateComponents)
    }
  }

  subscribeToComponents = (components) => {
    const {emitter} = this.context
    components.forEach(c => {
      emitter.addListener(`component:${c}:update`, this.updateComponents)
    })
  }

  unsubscribeToComponents = (components) => {
    const {emitter} = this.context
    components.forEach(c => {
      emitter.removeListener(`component:${c}:update`, this.updateComponents)
    })
  }

  componentDidMount() {
    const {components} = this.props
    this.subscribeToComponents(components)
    this.fetchAndRerender()
  }

  componentWillReceiveProps(nextProps) {
    const {components} = this.props
    const {components: nextComponents} = nextProps
    const Components = getImplementations(nextComponents)

    this.unsubscribeToComponents(components)
    this.subscribeToComponents(nextComponents)
    this.setState({Components})
  }

  componentDidUpdate() {
    this.fetchAndRerender()
  }

  componentWillUnmount() {
    const {components} = this.props
    this.unsubscribeToComponents(components)
  }

  render() {
    const {components, props, children} = this.props
    const {Components} = this.state

    // This extension point is not configured or it's assets haven't loaded yet.
    if (components.length === 0 || (Components.length !== components.length)) {
      return children
    }

    return Components.reduce((acc, Component) => {
      return <Component {...props}>{acc || children}</Component>
    }, null)
  }
}

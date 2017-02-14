import React, {Component, PropTypes} from 'react'
import treePath from 'react-tree-path'
import {canUseDOM} from 'exenv'
import state from '../state'

const {placeholders, components} = state
const EMPTY_OBJECT = {}
const empty = <span className="Placeholder--empty"></span>

const startPerf = function () {
  global.Perf.start()
}

const stopPerf = function () {
  global.Perf.stop()
  console.log(`Placeholder.render\tduration=${global.Perf.getLastMeasurements()[0].duration.toFixed(2)}ms\ttreePath=${this.props.treePath}`)
}

class Placeholder extends Component {
  constructor () {
    super()
    if (canUseDOM && global.Perf) {
      this.componentWillMount = startPerf
      this.componentWillUpdate = startPerf
      this.componentDidMount = stopPerf
      this.componentDidUpdate = stopPerf
    }
  }

  render () {
    const {treePath} = this.props
    const {component, settings} = placeholders[treePath] || EMPTY_OBJECT
    const {default: Component} = components[component] || EMPTY_OBJECT

    return Component
      ? <Component {...settings} />
      : this.props.children || empty
  }
}

Placeholder.propTypes = {
  id: PropTypes.string.isRequired,
  children: PropTypes.node,
  implementation: PropTypes.func,
  settings: PropTypes.object,
  treePath: PropTypes.string,
}

export default treePath(Placeholder)

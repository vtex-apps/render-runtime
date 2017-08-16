import React, {Component} from 'react'
import PropTypes from 'prop-types'
import Placeholder from './Placeholder'

// eslint-disable-next-line
class Container extends Component {
  render () {
    const {placeholders, treePath} = this.context
    const relative = name => name.replace(`${treePath}/`, '')
    const children = Object.values(placeholders).filter(
      p => p.component && p.name !== treePath && p.name.startsWith(treePath))
    const renderChildren =
      ({name}) => <Placeholder key={relative(name)} id={relative(name)} />

    return <div>{children.map(renderChildren)}</div>
  }
}

Container.contextTypes = {
  treePath: PropTypes.string,
  placeholders: PropTypes.object,
}

export default Container

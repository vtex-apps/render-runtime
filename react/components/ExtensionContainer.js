import React, {Component} from 'react'
import PropTypes from 'prop-types'
import ExtensionPoint from './ExtensionPoint'

// eslint-disable-next-line
class ExtensionContainer extends Component {
  render() {
    const {extensions, treePath} = this.context
    const relative = name => name.replace(`${treePath}/`, '')
    const children = Object.values(extensions).filter(
      p => p.component && p.name !== treePath && p.name.startsWith(treePath),
    )
    const renderChildren = ({name}) => (
      <ExtensionPoint key={relative(name)} id={relative(name)} />
    )

    return <div>{children.map(renderChildren)}</div>
  }
}

ExtensionContainer.contextTypes = {
  treePath: PropTypes.string,
  extensions: PropTypes.object,
}

export default ExtensionContainer

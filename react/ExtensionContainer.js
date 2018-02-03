import React, {Component} from 'react'
import PropTypes from 'prop-types'

import ExtensionPoint from './ExtensionPoint'

// eslint-disable-next-line
class ExtensionContainer extends Component {
  static contextTypes = {
    extensions: PropTypes.object,
    treePath: PropTypes.string,
  }

  render() {
    const {extensions, treePath} = this.context
    const relative = name => name.replace(`${treePath}/`, '')
    const children = Object.keys(extensions).filter(
      extension => {
        return extensions[extension].component &&
          extension !== treePath &&
          (new RegExp(`^${treePath}/[a-zA-Z0-9-]+$`)).test(extension)
      }
    )
    const renderChildren = (extension) => (
      <ExtensionPoint key={relative(extension)} id={relative(extension)} />
    )

    return <div>{children.map(renderChildren)}</div>
  }
}

export default ExtensionContainer

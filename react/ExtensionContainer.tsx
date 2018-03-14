import PropTypes from 'prop-types'
import React, {Component} from 'react'

import ExtensionPoint from './ExtensionPoint'

// eslint-disable-next-line
class ExtensionContainer extends Component {
  public static contextTypes = {
    extensions: PropTypes.object,
    treePath: PropTypes.string,
  }

  public context!: RenderContext

  public render() {
    const {extensions, treePath} = this.context
    const relative = (name: string) => name.replace(`${treePath}/`, '')
    const children = Object.keys(extensions).filter(
      extension => {
        return extensions[extension].component &&
          extension !== treePath &&
          (new RegExp(`^${treePath}/[a-zA-Z0-9-]+$`)).test(extension)
      }
    )
    const renderChildren = (extension: string) => (
      <ExtensionPoint key={relative(extension)} id={relative(extension)} />
    )

    return <div>{children.map(renderChildren)}</div>
  }
}

export default ExtensionContainer

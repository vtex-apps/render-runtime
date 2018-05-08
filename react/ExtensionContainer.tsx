import PropTypes from 'prop-types'
import React, {Component, Fragment} from 'react'

import ExtensionPoint from './ExtensionPoint'
import {getDirectChildren} from './utils/treePath'

class ExtensionContainer extends Component {
  public static contextTypes = {
    extensions: PropTypes.object,
    treePath: PropTypes.string,
  }

  public context!: RenderContext

  public render() {
    const {extensions, treePath} = this.context
    const children = getDirectChildren(extensions, treePath)
    return (
      <Fragment>
        {children.map(id =>
          <ExtensionPoint {...this.props} key={id} id={id} />
        )}
      </Fragment>
    )
  }
}

export default ExtensionContainer

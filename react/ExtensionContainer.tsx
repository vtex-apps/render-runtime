import PropTypes from 'prop-types'
import React, {Component, Fragment} from 'react'

import {TreePathProps} from 'react-tree-path'
import {RenderContext} from './components/RenderContext'
import ExtensionPoint from './ExtensionPoint'
import {getDirectChildren} from './utils/treePath'

class ExtensionContainer extends Component {
  public static contextTypes = {
    treePath: PropTypes.string,
  }

  public context!: TreePathProps

  public render() {
    return (
      <RenderContext.Consumer>
        {runtime =>
          getDirectChildren(runtime!.extensions, this.context.treePath)
            .map(id =><ExtensionPoint {...this.props} key={id} id={id} />)
        }
      </RenderContext.Consumer>
    )
  }
}

export default ExtensionContainer

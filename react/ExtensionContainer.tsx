import PropTypes from 'prop-types'
import React, { Component } from 'react'

import { RenderContext } from './components/RenderContext'
import ExtensionPoint from './ExtensionPoint'
import { getDirectChildren, TreePathContext } from './utils/treePath'

class ExtensionContainer extends Component {
  public render() {
    return (
      <RenderContext.Consumer>
        {runtime =>
          <TreePathContext.Consumer>
            {({ treePath }) =>
              getDirectChildren(runtime.extensions, treePath)
                .map(id => parseInt(id))
                .sort()
                .map(id => <ExtensionPoint {...this.props} key={id} id={id.toString()} />)
            }
          </TreePathContext.Consumer>
        }
      </RenderContext.Consumer>  
  }
}

export default ExtensionContainer

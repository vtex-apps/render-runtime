import PropTypes from 'prop-types'
import React, {Component} from 'react'

import {getDirectChildren, TreePathContext} from '../utils/treePath'
import ExtensionPoint from './ExtensionPoint'
import {RenderContext} from './RenderContext'

interface Props {
  id: string,
}

class ExtensionContainer extends Component<Props> {
  public static propTypes = {
    id: PropTypes.string,
  }

  public render() {
    const {id} = this.props

    return (
      <RenderContext.Consumer>
        {runtime =>
          <TreePathContext.Consumer>
            {({treePath}) => {
                const containerTreePath = runtime.joinTreePath(treePath, id)
                return getDirectChildren(runtime.extensions, containerTreePath)
                  .map(cid => {
                    const childTreePath = runtime.joinTreePath(id, cid)
                    return <ExtensionPoint {...this.props} key={childTreePath} id={childTreePath} />
                  })
              }
            }
          </TreePathContext.Consumer>
        }
      </RenderContext.Consumer>
    )
  }
}

export default ExtensionContainer

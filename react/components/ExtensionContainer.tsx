import PropTypes from 'prop-types'
import React, {Component} from 'react'

import {getDirectChildren, TreePathContext} from '../utils/treePath'
import ExtensionPoint from './ExtensionPoint'
import {RenderContext} from './RenderContext'

const join = (p: string | null, c: string | null): string =>
  [p, c].filter(id => !!id).join('/')

interface Props {
  id: string | null,
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
                const containerTreePath = join(treePath, id)
                return getDirectChildren(runtime.extensions, containerTreePath)
                  .map(cid => {
                    const childTreePath = join(id, cid)
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

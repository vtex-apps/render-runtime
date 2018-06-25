import PropTypes from 'prop-types'
import React, {Component, Fragment} from 'react'

import {RenderContext} from './components/RenderContext'
import ExtensionPoint from './ExtensionPoint'
import {getDirectChildren, TreePathContext} from './utils/treePath'

const join = (p: string | null, c: string | null): string => {
  if (!p) {
    return c as string
  } else if (!c) {
    return p
  }
  return `${p}/${c}`
}


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
            {({treePath}) =>
              getDirectChildren(runtime.extensions, join(treePath, id))
                .map(cid => <ExtensionPoint {...this.props} key={join(id, cid)} id={join(id, cid)} />)
            }
          </TreePathContext.Consumer>
        }
      </RenderContext.Consumer>
    )
  }
}

export default ExtensionContainer

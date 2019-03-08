import React, { Component, ReactPortal } from 'react'

import { createPortal } from '../utils/dom'
import { getDirectChildren, TreePathContext } from '../utils/treePath'
import ExtensionPoint from './ExtensionPoint'
import { RenderContext } from './RenderContext'

interface Props {
  query: any,
  params: any
}

class LegacyExtensionContainer extends Component<Props, {hydrate: boolean}> {
  public state = {
    hydrate: false
  }

  public componentDidMount() {
    this.setState({hydrate: true})
  }

  public render() {
    const {params, query} = this.props
    return (
      <RenderContext.Consumer>
        {runtime =>
          <TreePathContext.Consumer>
            {({treePath}) =>
              getDirectChildren(runtime.extensions, treePath)
                .map(id => createPortal(<ExtensionPoint id={id} query={query} params={params} />, `${treePath}/${id}`, this.state.hydrate) as ReactPortal)
            }
          </TreePathContext.Consumer>
        }
      </RenderContext.Consumer>
    )
  }
}

export default LegacyExtensionContainer

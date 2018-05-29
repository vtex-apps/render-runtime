import PropTypes from 'prop-types'
import React, {Component, Fragment} from 'react'

import {TreePathProps} from 'react-tree-path'
import {RenderContext} from './components/RenderContext'
import ExtensionPoint from './ExtensionPoint'
import {createPortal} from './utils/dom'
import {getDirectChildren} from './utils/treePath'

interface Props {
  query: any,
  params: any
}

class LegacyExtensionContainer extends Component<Props, {hydrate: boolean}> {
  public static contextTypes = {
    treePath: PropTypes.string,
  }

  public state = {
    hydrate: false
  }

  public context!: TreePathProps

  public componentDidMount() {
    this.setState({hydrate: true})
  }

  public render() {
    const {params, query} = this.props
    const {treePath} = this.context
    return (
      <RenderContext.Consumer>
        {runtime =>
          getDirectChildren(runtime!.extensions, treePath)
            .map(id => createPortal(<ExtensionPoint id={id} query={query} params={params} />, `${treePath}/${id}`, this.state.hydrate))
        }
      </RenderContext.Consumer>
    )
  }
}

export default LegacyExtensionContainer

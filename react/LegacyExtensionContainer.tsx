import PropTypes from 'prop-types'
import React, {Component, Fragment} from 'react'

import ExtensionPoint from './ExtensionPoint'
import {createPortal} from './utils/dom'
import {getDirectChildren} from './utils/treePath'

interface Props {
  query: any,
  params: any
}

class LegacyExtensionContainer extends Component<Props, {hydrate: boolean}> {
  public static contextTypes = {
    extensions: PropTypes.object,
    treePath: PropTypes.string,
  }

  public state = {
    hydrate: false
  }

  public context!: RenderContext

  public componentDidMount() {
    this.setState({hydrate: true})
  }

  public render() {
    const {params, query} = this.props
    const {extensions, treePath} = this.context
    const children = getDirectChildren(extensions, treePath)
    return children.map(id => createPortal(<ExtensionPoint id={id} query={query} params={params} />, `${treePath}/${id}`, this.state.hydrate))
  }
}

export default LegacyExtensionContainer

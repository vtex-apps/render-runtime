import PropTypes from 'prop-types'
import React, {Component, ReactElement} from 'react'
import withTreePath, {TreePathProps} from 'react-tree-path'

import ExtensionPointComponent from './components/ExtensionPointComponent'
import {RenderContext} from './components/RenderContext'
import {RenderProviderState} from './components/RenderProvider'

interface Props {
  id: string,
  params?: any,
  query?: any,
}

type ExtendedProps = Props & TreePathProps

interface State {
  component: string | null,
  props: any
}

class ExtensionPoint extends Component<ExtendedProps> {
  public static propTypes = {
    children: PropTypes.node,
    params: PropTypes.object,
    query: PropTypes.object,
    treePath: PropTypes.string.isRequired,
  }

  public render() {
    return (
      <RenderContext.Consumer>
        {this.getExtensionPointComponent}
      </RenderContext.Consumer>
    )
  }

  private getExtensionPointComponent = (runtime?: RenderContext) => {
    const {children, params, query, id, treePath, ...parentProps} = this.props
    const extension = runtime!.extensions[treePath]
    const component = extension ? extension.component : null
    const extensionProps = extension ? extension.props : null

    const props = {
      ...parentProps,
      ...extensionProps,
      params,
      query
    }

    return <ExtensionPointComponent component={component} props={props} treePath={treePath}>{children}</ExtensionPointComponent>
  }
}

export default withTreePath<Props>(ExtensionPoint)

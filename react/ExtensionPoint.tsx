import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {TreePathContext, TreePathProps, withTreePath} from './utils/treePath'

import ExtensionPointComponent from './components/ExtensionPointComponent'
import {RenderContext} from './components/RenderContext'

interface Props {
  id: string,
  params?: any,
  query?: any,
}

type ExtendedProps = Props & TreePathProps

interface State {
  newTreePath: string
}

class ExtensionPoint extends Component<ExtendedProps, State> {
  public static propTypes = {
    children: PropTypes.node,
    params: PropTypes.object,
    query: PropTypes.object,
    treePath: PropTypes.string.isRequired,
  }

  public static childContextTypes = {
    treePath: PropTypes.string
  }

  private static mountTreePath (currentId: string, parentTreePath: string) {
    return [parentTreePath, currentId].filter(id => !!id).join('/')
  }

  public componentWillMount() {
    this.componentWillReceiveProps(this.props)
  }

  public componentWillReceiveProps(nextProps: ExtendedProps) {
    this.setState({
      newTreePath: ExtensionPoint.mountTreePath(nextProps.id, nextProps.treePath)
    })
  }

  public getChildContext() {
    return { treePath: this.state.newTreePath }
  }

  public render() {
    return (
      <RenderContext.Consumer>
        {this.getExtensionPointComponent}
      </RenderContext.Consumer>
    )
  }

  private getExtensionPointComponent = (runtime: RenderContext) => {
    const {newTreePath} = this.state
    const {children, params, query, id, treePath, ...parentProps} = this.props
    const extension = runtime.extensions[newTreePath]
    const component = extension ? extension.component : null
    const extensionProps = extension ? extension.props : null

    const props = {
      ...parentProps,
      ...extensionProps,
      params,
      query,
    }

    return (
      <TreePathContext.Provider value={{treePath: newTreePath}}>
        <ExtensionPointComponent component={component} props={props} runtime={runtime} treePath={newTreePath}>{children}</ExtensionPointComponent>
      </TreePathContext.Provider>
    )
  }
}

export default withTreePath(ExtensionPoint)

import PropTypes from 'prop-types'
import React, {Component} from 'react'
import ReactDOM from 'react-dom'

import {getImplementation} from './utils/assets'
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

  public static getDerivedStateFromProps(props: ExtendedProps) {
    return {
      newTreePath: ExtensionPoint.mountTreePath(props.id, props.treePath)
    }
  }

  private static mountTreePath (currentId: string, parentTreePath: string) {
    return [parentTreePath, currentId].filter(id => !!id).join('/')
  }

  private component?: string | null

  constructor (props: ExtendedProps) {
    super(props)

    this.state = {
      newTreePath: ExtensionPoint.mountTreePath(props.id, props.treePath)
    }
  }

  public getChildContext() {
    return { treePath: this.state.newTreePath }
  }

  public componentDidMount() {
    this.addDataToElementIfEditable()
  }

  public componentDidUpdate() {
    this.addDataToElementIfEditable()
  }

  public componentWillUnmount() {
    this.removeDataFromElement()
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

    this.component = component

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

  private addDataToElementIfEditable = () => {
    const ComponentImpl = this.component && getImplementation(this.component)
    const isEditable = ComponentImpl && (ComponentImpl.hasOwnProperty('schema') || ComponentImpl.hasOwnProperty('getSchema'))

    if (this.component && !isEditable) {
      return
    }

    const element = ReactDOM.findDOMNode(this) as Element

    if (element && element.setAttribute) {
      element.setAttribute('data-extension-point', this.state.newTreePath)
    }
  }

  private removeDataFromElement = () => {
    const element = ReactDOM.findDOMNode(this) as Element

    if (element && element.removeAttribute) {
      element.removeAttribute('data-extension-point')
    }
  }
}

export default withTreePath(ExtensionPoint)

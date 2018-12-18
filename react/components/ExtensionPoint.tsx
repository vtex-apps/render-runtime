import PropTypes from 'prop-types'
import React, { Component } from 'react'
import ReactDOM from 'react-dom'

import { getImplementation } from '../utils/assets'
import { TreePathContext, TreePathProps, withTreePath } from '../utils/treePath'

import ExtensionPointComponent from './ExtensionPointComponent'
import Loading from './Loading'
import { RenderContext } from './RenderContext'

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

  private static mountTreePath(currentId: string, parentTreePath: string) {
    return [parentTreePath, currentId].filter(id => !!id).join('/')
  }

  private component?: string | null

  constructor(props: ExtendedProps) {
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
    const { newTreePath } = this.state
    const { children, params, query, id, treePath, ...parentProps } = this.props
    const extension = runtime.extensions && runtime.extensions[newTreePath]
    const { component = null, wrappers = [], props: extensionProps = null } = extension || {}

    this.component = component

    const props = {
      ...parentProps,
      ...extensionProps,
      params,
      query,
    }

    let loading = null
    if (runtime.preview) {
      loading = <Loading />
    }

    return component
      ? <TreePathContext.Provider value={{ treePath: newTreePath }}>
        {
          this.withWrappers(
          wrappers,
          treePath,
          props,
          runtime,
          <ExtensionPointComponent component={component} props={props} runtime={runtime} treePath={newTreePath}>{children}</ExtensionPointComponent>
        )}
      </TreePathContext.Provider>
      : loading
  }

  private withWrappers(wrappers: string[], treePath: string, props: any, runtime: RenderContext, element: JSX.Element) {
    if (wrappers.length === 0) {
      return element
    }

    return wrappers.slice().reverse().reduce((acc, wrapper) => (
      <ExtensionPointComponent component={wrapper} props={props} runtime={runtime} treePath={treePath}>
        {acc}
      </ExtensionPointComponent>
    ), element)
  }

  private addDataToElementIfEditable = () => {
    const ComponentImpl = this.component && getImplementation(this.component)
    const isEditable = ComponentImpl && (ComponentImpl.hasOwnProperty('schema') || ComponentImpl.hasOwnProperty('getSchema'))

    if (!isEditable) {
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

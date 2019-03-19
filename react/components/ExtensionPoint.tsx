import PropTypes from 'prop-types'
import React, { Component, Fragment } from 'react'
import ReactDOM from 'react-dom'

import { getImplementation } from '../utils/assets'
import { TreePathContext, TreePathProps, withTreePath } from '../utils/treePath'

import ExtensionPointComponent from './ExtensionPointComponent'
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
    treePath: PropTypes.string,
  }

  public static getDerivedStateFromProps(props: ExtendedProps) {
    return {
      newTreePath: ExtensionPoint.mountTreePath(props.id, props.treePath),
    }
  }

  private static mountTreePath(currentId: string, parentTreePath: string) {
    return [parentTreePath, currentId].filter(id => !!id).join('/')
  }

  private component?: string | null

  constructor(props: ExtendedProps) {
    super(props)

    this.state = {
      newTreePath: ExtensionPoint.mountTreePath(props.id, props.treePath),
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

  /** This function is used for rendering the previews of child elements
   * of the component, while the component is not loaded
   */
  private renderChildElements = (runtime: RenderContext) => {
    const { newTreePath } = this.state
    const extension = runtime.extensions && runtime.extensions[newTreePath]
    const { props = {} } = extension || {}

    const elementIds: string[]  = props.elements

    const elements = elementIds &&
      elementIds.map((elementId:string, i:number) => {
        const elementTreePath = `${runtime.page}/${elementId}`
        const currentExtension = runtime.extensions[elementTreePath]

        if (currentExtension) {
          return (
            <TreePathContext.Provider value={{ treePath: elementTreePath }} key={i}>
              <ExtensionPointComponent
                component={currentExtension.component}
                props={currentExtension.props}
                runtime={runtime}
                treePath={elementTreePath} />
            </TreePathContext.Provider>
          )
        }
        return null
      })

    return elements
  }

  private getExtensionPointComponent = (runtime: RenderContext) => {
    const { newTreePath } = this.state
    const { children, params, query, id, treePath, ...parentProps } = this.props
    const extension = runtime.extensions && runtime.extensions[newTreePath]
    const { component = null, after = [], around = [], before = [], content = {}, props: extensionProps = null } = extension || {}

    this.component = component

    const props = {
      ...parentProps,
      ...extensionProps,
      ...content,
      params,
      query,
    }

    return this.withOuterExtensions(
      after,
      around,
      before,
      newTreePath,
      props,
      (
        <TreePathContext.Provider value={{ treePath: newTreePath }}>
          {component ? (
            <ExtensionPointComponent
              component={component}
              props={props}
              runtime={runtime}
              treePath={newTreePath}>
              {children}
            </ExtensionPointComponent>
          ) : this.renderChildElements(runtime)}
        </TreePathContext.Provider>
      )
    )
  }

  private withOuterExtensions(after: string[], around: string[], before: string[], treePath: string, props: any, element: JSX.Element) {
    const beforeElements = (
      <Fragment>
        {before.map(beforeId => (
          <ExtensionPoint
            id={beforeId}
            key={beforeId}
            treePath={treePath}
            params={props.params}
            query={props.query}
          />
        ))}
      </Fragment>
    )

    const afterElements = (
      <Fragment>
        {after.map(afterId => (
          <ExtensionPoint
            id={afterId}
            key={afterId}
            treePath={treePath}
            params={props.params}
            query={props.query}
          />
        ))}
      </Fragment>
    )

    const wrapped = (
      <Fragment>
        {beforeElements}
        {element}
        {afterElements}
      </Fragment>
    )

    return around.reduce((acc, aroundId) => (
      <ExtensionPoint id={aroundId} treePath={treePath} {...props}>
        {acc}
      </ExtensionPoint>
    ), wrapped)
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

import PropTypes from 'prop-types'
import { mergeDeepRight, reduce } from 'ramda'
import React, { Component, Fragment } from 'react'
import ReactDOM from 'react-dom'

import { getImplementation } from '../utils/assets'
import { TreePathContext, TreePathProps, withTreePath } from '../utils/treePath'

import ExtensionPointComponent from './ExtensionPointComponent'
import { RenderContext } from './RenderContext'
import TrackEventsWrapper from './TrackEventsWrapper'

interface Props {
  id: string
  params?: any
  query?: any
  treePath?: string
  blockProps?: object
}

type ExtendedProps = Props & TreePathProps

interface State {
  newTreePath: string
}

class ExtensionPoint extends Component<ExtendedProps, State> {
  public static propTypes = {
    blockProps: PropTypes.object,
    children: PropTypes.node,
    id: PropTypes.string,
    params: PropTypes.object,
    query: PropTypes.object,
    treePath: PropTypes.string,
  }

  public static defaultProps = {
    blockProps: {},
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

    const elementIds: string[] = props.elements

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
    const {
      children,
      params,
      query,
      id,
      treePath,
      blockProps,
      ...parentProps
    } = this.props

    const extension = runtime.extensions && runtime.extensions[newTreePath]
    const {
      component = null,
      after = [],
      around = [],
      before = [],
      content = {},
      props: extensionProps = {},
      track = []
    } = extension || {}

    this.component = component

    const props = reduce(mergeDeepRight, {}, [
      /** Extra props passed to the ExtensionPoint component
       * e.g. <ExtensionPoint foo="bar" />
       */
      parentProps,
      /** Props that are read from runtime.extensions, that come from the blocks files
       */
      extensionProps,
      /** Props from the blockProps prop, used when the user wants to prevent overriding
       * the native ExtensionPoint props (such as `id`)
       */
      blockProps,
      content,
      { params, query },
    ])

    const isCompositionChildren = extension && extension.composition === 'children'

    const componentChildren = (isCompositionChildren && extension.blocks) ?
      this.getChildExtensions(runtime, newTreePath) : children

    return this.withOuterExtensions(
      after,
      around,
      before,
      newTreePath,
      props,
      (
        <TrackEventsWrapper
          events={track}
          id={id}>
          <TreePathContext.Provider value={{ treePath: newTreePath }}>
            {component ? (
              <ExtensionPointComponent component={component} props={props} runtime={runtime} treePath={newTreePath}>
                {componentChildren}
              </ExtensionPointComponent>
            ) : this.renderChildElements(runtime)}
          </TreePathContext.Provider>
        </TrackEventsWrapper>
      )
    )
  }

  private getChildExtensions(runtime: RenderContext, treePath: string) {
    const extension = runtime.extensions && runtime.extensions[treePath]

    if (!extension || !extension.blocks) {
      return
    }

    return extension.blocks.map((child, i) => {
      const childTreePath = ExtensionPoint.mountTreePath(child.extensionPointId, treePath)
      const childExtension = runtime.extensions && runtime.extensions[childTreePath]
      const childProps = childExtension ? childExtension.props : {}

      /* This ExtensionPointWrapper thing is done so the user can read
        * the props that were passed through the blocks.json file to
        * its children in a standard, React-ish way; that is:
        * `React.Children.map(children, child => child.props)`
        * 
        * The problem was, if the user passed a prop that conflicted with
        * ExtensionPoint props (most notabily, `id`), just destructuring
        * the `childProps` over ExtensionPoint would override the 
        * ExtensionPoint props, which would break the rendering.
        * (or vice versa, which would cause wrong values being read by
        * the user component). 
      */
      const ExtensionPointWrapper = (blockProps: object) => (
        <ExtensionPoint
          id={child.extensionPointId}
          treePath={treePath}
          blockProps={blockProps}
        />
      )

      return (
        <ExtensionPointWrapper
          key={i}
          {...childProps}
        />
      )
    })
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

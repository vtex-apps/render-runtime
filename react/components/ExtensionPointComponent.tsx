import PropTypes from 'prop-types'
import React, {ErrorInfo, PureComponent, ReactElement} from 'react'

import {getImplementation} from '../utils/assets'
import logEvent from '../utils/logger'
import ExtensionPointError from './ExtensionPointError'
import {RenderContextProps} from './RenderContext'

interface Props {
  component: string | null
  props: any
  treePath: string
}

interface ErrorHandle {
  component?: JSX.Element | null
  recover?: () => void
}

interface State {
  error?: ErrorHandle | null
  lastUpdate?: number
}

const componentPromiseMap: any = {}

class ExtensionPointComponent extends PureComponent<Props & RenderContextProps, State> {
  public static propTypes = {
    children: PropTypes.node,
    component: PropTypes.string,
    props: PropTypes.object,
    runtime: PropTypes.object,
    treePath: PropTypes.string,
  }

  // tslint:disable-next-line:variable-name
  private _isMounted!: boolean
  private emptyExtensionPoint: Extension
  private editableExtensionPoint: Extension

  constructor(props: Props & RenderContextProps) {
    super(props)

    const root = props.treePath && props.treePath.split('/')[0]
    this.emptyExtensionPoint = props.runtime.extensions[`${root}/__empty`]
    this.editableExtensionPoint = props.runtime.extensions[`${root}/__editable`]
    this.state = {}
  }

  public updateComponentsWithEvent = (component: string) => {
    if (!this._isMounted) {
      return false
    }

    this.setState({error: null, lastUpdate: Date.now()})
    const {component: mounted, treePath} = this.props
    console.log(`[render] Component updated. treePath=${treePath} ${mounted !== component ? `mounted=${mounted} ` : ''}updated=${component}`)
  }

  public fetchAndRerender = () => {
    const {component, runtime: {fetchComponent}} = this.props
    const Component = component && getImplementation(component)

    // Let's fetch the assets and re-render.
    if (component && !Component && !componentPromiseMap[component]) {
      componentPromiseMap[component] = fetchComponent(component)
      .then(() => this.updateComponentsWithEvent(component))
    }
  }

  public clearError = () => {
    this.setState({error: null})
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const {treePath, runtime: {account, workspace, production, page, pages}} = this.props
    const {message, stack} = error
    const {componentStack} = errorInfo
    const event = {
      data: {
        account,
        componentStack,
        message,
        path: treePath,
        stack,
        workspace
      },
      name: 'JSError'
    }

    console.error('Failed to render extension point', treePath)
    logEvent(event)

    // Only show errors in production if the entire page explodes. (Ignore nested extension points)
    const muteError = production && !pages[treePath] && !page.startsWith('admin/')
    const errorHandle = {
      component: muteError
        ? null
        : <ExtensionPointError error={error} errorInfo={errorInfo} treePath={treePath} />,
      recover: this.clearError,
    }

    this.setState({error: errorHandle})
  }

  public componentDidMount() {
    this._isMounted = true
    this.fetchAndRerender()
  }

  public componentDidUpdate() {
    this.fetchAndRerender()
  }

  public componentWillUnmount() {
    this._isMounted = false
  }

  public render() {
    const {component, props, children, treePath, runtime: {production}} = this.props
    const {error} = this.state
    const Component = component && getImplementation(component)

    // A children of this extension point throwed an uncaught error
    if (error && !(Component as any).hotReload) {
      return error.component
    }

    const componentProps =  {...props, ...error && {__errorHandle: error}}
    const EmptyExtensionPoint = this.emptyExtensionPoint && getImplementation(this.emptyExtensionPoint.component)
    const EditableExtensionPoint = this.editableExtensionPoint && getImplementation<EditableExtensionPointProps>(this.editableExtensionPoint.component)

    // This extension point is not configured.
    if (!component && !production && this.emptyExtensionPoint) {
      return <EditableExtensionPoint treePath={treePath} component={this.emptyExtensionPoint.component}><EmptyExtensionPoint /></EditableExtensionPoint>
    }

    const isEditable = Component && (Component.hasOwnProperty('schema') || Component.hasOwnProperty('getSchema'))
    const configuredComponent = Component ? <Component {...componentProps}>{children}</Component> : children || null
    return this.editableExtensionPoint && isEditable
      ? <EditableExtensionPoint treePath={treePath} component={component} props={componentProps}>{configuredComponent}</EditableExtensionPoint>
      : configuredComponent
  }
}

interface EditableExtensionPointProps {
  treePath: string
  component: string | null
  props?: any
}

export default ExtensionPointComponent

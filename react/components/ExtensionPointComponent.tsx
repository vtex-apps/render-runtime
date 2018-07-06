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

interface State {
  error?: Error | null
  errorInfo?: ErrorInfo | null
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

    this.setState({error: null, errorInfo: null, lastUpdate: Date.now()})
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
    this.setState({
      error: null,
      errorInfo: null,
    })
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const {treePath: path, runtime: {account, workspace}} = this.props
    const {message, stack} = error
    const {componentStack} = errorInfo
    const event = {
      data: {
        account,
        componentStack,
        message,
        path,
        stack,
        workspace
      },
      name: 'JSError'
    }

    console.error('Failed to render extension point', path)
    logEvent(event)

    this.setState({
      error,
      errorInfo,
    })
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
    const {component, props, children, treePath, runtime: {production, pages, page}} = this.props
    const {error, errorInfo} = this.state
    const Component = component && getImplementation(component)

    // A children of this extension point throwed an uncaught error
    // Only show errors in production if the entire page explodes. (Ignore nested extension points)
    if (error) {
      if (production && !pages[treePath] && !page.startsWith('admin/')) {
        return null
      }

      const errorInstance = <ExtensionPointError error={error} errorInfo={errorInfo!} treePath={treePath} />
      props.__errorInstance = errorInstance
      props.__clearError = this.clearError

      if (!(Component as any).hotReload) {
        return errorInstance
      }
    } else {
      delete props.__errorInstance
      delete props.__clearError
    }

    const EmptyExtensionPoint = this.emptyExtensionPoint && getImplementation(this.emptyExtensionPoint.component)
    const EditableExtensionPoint = this.editableExtensionPoint && getImplementation<EditableExtensionPointProps>(this.editableExtensionPoint.component)

    // This extension point is not configured.
    if (!component && !production && this.emptyExtensionPoint) {
      return <EditableExtensionPoint treePath={treePath} component={this.emptyExtensionPoint.component}><EmptyExtensionPoint /></EditableExtensionPoint>
    }

    const isEditable = Component && (Component.hasOwnProperty('schema') || Component.hasOwnProperty('getSchema'))
    const configuredComponent = Component ? <Component {...props}>{children}</Component> : children || null
    return this.editableExtensionPoint && isEditable
      ? <EditableExtensionPoint treePath={treePath} component={component}>{configuredComponent}</EditableExtensionPoint>
      : configuredComponent
  }
}

interface EditableExtensionPointProps {
  treePath: string
  component: string | null
  props?: any
}

export default ExtensionPointComponent

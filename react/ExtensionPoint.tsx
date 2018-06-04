import PropTypes from 'prop-types'
import React, {Component, ReactElement} from 'react'
import withTreePath, {TreePathProps} from 'react-tree-path'

import ExtensionPointComponent from './components/ExtensionPointComponent'
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

class ExtensionPoint extends Component<ExtendedProps, State> {
  public static contextTypes = {
    emitter: PropTypes.object,
    extensions: PropTypes.object,
    production: PropTypes.bool,
  }

  public static propTypes = {
    children: PropTypes.node,
    params: PropTypes.object,
    query: PropTypes.object,
    treePath: PropTypes.string.isRequired,
  }

  public context!: RenderContext

  constructor(props: ExtendedProps, context: RenderContext) {
    super(props, context)
    this.state = this.getExtensionPointState(props.treePath, context.extensions)
  }

  public getExtensionPointState = (treePath: string, extensions: Extensions): State => {
    const extension = extensions[treePath]
    return {
      component: extension ? extension.component : null,
      props: extension ? extension.props : null,
    }
  }

  public updateExtensionPoint = (state?: RenderProviderState) => {
    if (state && state.extensions) {
      this.context.extensions = state.extensions
    }
    this.setState(this.getExtensionPointState(this.props.treePath, this.context.extensions))
  }

  public subscribeToTreePath = (treePath: string) => {
    const {emitter} = this.context
    emitter.addListener(`extension:${treePath}:update`, this.updateExtensionPoint)
  }

  public unsubscribeToTreePath = (treePath: string) => {
    const {emitter} = this.context
    emitter.removeListener(`extension:${treePath}:update`, this.updateExtensionPoint)
  }

  public componentDidMount() {
    const {production} = this.context
    const {treePath} = this.props

    this.subscribeToTreePath('*')
    if (!production) {
      this.subscribeToTreePath(treePath)
    }
  }

  public componentWillReceiveProps(nextProps: ExtendedProps) {
    const {production} = this.context

    if (nextProps.treePath !== this.props.treePath) {
      if (!production) {
        this.unsubscribeToTreePath(this.props.treePath)
        this.subscribeToTreePath(nextProps.treePath)
      }

      this.setState(this.getExtensionPointState(nextProps.treePath, this.context.extensions))
    }
  }

  public componentWillUnmount() {
    const {production} = this.context
    const {treePath} = this.props

    this.unsubscribeToTreePath('*')
    if (!production) {
      this.unsubscribeToTreePath(treePath)
    }
  }

  public render() {
    const {children, params, query, id, ...parentProps} = this.props
    const {component, props: extensionProps} = this.state

    const props = {
      ...parentProps,
      ...extensionProps,
      params,
      query,
    }

    return <ExtensionPointComponent component={component} props={props}>{children}</ExtensionPointComponent>
  }
}

export default withTreePath<Props>(ExtensionPoint)

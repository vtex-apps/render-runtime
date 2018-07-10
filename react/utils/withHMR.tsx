import hoistNonReactStatics from 'hoist-non-react-statics'
import PropTypes from 'prop-types'
import React, {Component, ComponentType} from 'react'

import {withEmitter} from '../components/RenderContext'
import {withTreePath} from './treePath'

const isComponentType = (Arg: any): Arg is ComponentType => {
  return typeof Arg === 'function' || (Arg && Arg.prototype && Arg.prototype.render)
}

export default (module: Module, InitialImplementer: any) => {
  if (!isComponentType(InitialImplementer) || !module.hot) {
    return InitialImplementer
  }

  const instances: HMRComponent[] = []
  const registerInstance = (instance: HMRComponent) => {
    instances.push(instance)
  }

  const unregisterInstance = (instance: HMRComponent) => {
    const index = instances.findIndex(registered => registered === instance)
    if (index !== -1) {
      instances.splice(index, 1)
    }
  }

  class HMRComponent extends Component<any, {lastUpdate?: number}> {
    public static propTypes = {
      __clearError: PropTypes.func,
      __errorInstance: PropTypes.node,
    }

    public static get displayName(): string {
      return HMRComponent.Implementer.displayName || HMRComponent.Implementer.name || 'Component'
    }

    public static hotReload = (NewImplementer: ComponentType) => {
      HMRComponent.Implementer = NewImplementer
      hoistNonReactStatics(HMRComponent, NewImplementer)
      instances.forEach(instance => instance.updateComponent())
    }

    private static Implementer = InitialImplementer as ComponentType

    public updateComponent = () => {
      const {__emitter, treePath, __clearError, __errorInstance} = this.props
      __emitter.emit('build.status', 'hmr:success')

      if (__clearError && __errorInstance) {
        __clearError()
      } else {
        this.setState({lastUpdate: Date.now()})
      }

      console.log(`[render] Component updated. treePath=${treePath} updated=${HMRComponent.displayName}`)
    }

    public componentDidMount() {
      registerInstance(this)
    }

    public componentWillUnmount() {
      unregisterInstance(this)
    }

    public render() {
      const {__emitter, __clearError, __errorInstance, ...props} = this.props
      return this.props.__errorInstance || <HMRComponent.Implementer {...props} />
    }
  }

  return hoistNonReactStatics(withEmitter(withTreePath(HMRComponent)), InitialImplementer)
}

import hoistNonReactStatics from 'hoist-non-react-statics'
import PropTypes from 'prop-types'
import React, {Component, ComponentType} from 'react'

import {withContext} from '../components/RenderContext'
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
      __errorHandle: PropTypes.object,
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
      const {runtime: {emitter}, treePath, __errorHandle} = this.props
      emitter.emit('build.status', 'hmr:success')

      if (__errorHandle && __errorHandle.recover) {
        __errorHandle.recover()
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
      const {__errorHandle, ...props} = this.props
      return __errorHandle && __errorHandle.component || <HMRComponent.Implementer {...props} />
    }
  }

  return hoistNonReactStatics(withContext(withTreePath(HMRComponent)), InitialImplementer)
}

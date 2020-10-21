import hoistNonReactStatics from 'hoist-non-react-statics'
import React, { ComponentType, useContext } from 'react'
import { History } from 'history'
import {
  ConfigurationDevice,
  RenderHistoryLocation,
  SetQueryOptions,
  PageContextOptions,
} from '../typings/global'
import { RenderRuntime, Components, Extension } from '../typings/runtime'
import { NavigationRouteModifier, NavigateOptions } from '../utils/pages'

export interface RenderContext
  extends Pick<
    RenderRuntime,
    | 'account'
    | 'amp'
    | 'binding'
    | 'components'
    | 'contentMap'
    | 'culture'
    | 'defaultExtensions'
    | 'deviceInfo'
    | 'emitter'
    | 'extensions'
    | 'hints'
    | 'inspect'
    | 'messages'
    | 'page'
    | 'pages'
    | 'platform'
    | 'preview'
    | 'production'
    | 'publicEndpoint'
    | 'query'
    | 'renderMajor'
    | 'rootPath'
    | 'route'
    | 'workspace'
  > {
  addMessages: (newMessages: RenderRuntime['messages']) => Promise<void>
  addNavigationRouteModifier: (modifier: NavigationRouteModifier) => void
  ensureSession: () => Promise<void>
  fetchComponent: (component: string) => Promise<unknown>
  fetchComponents: (
    components: RenderRuntime['components'],
    extensions?: RenderRuntime['extensions']
  ) => Promise<void>
  getSettings: (app: string) => any
  goBack: () => void
  device: string
  history: History | null
  navigate: (options: NavigateOptions) => boolean
  onPageChanged: (location: RenderHistoryLocation) => void
  patchSession: (data?: any) => Promise<void>
  prefetchDefaultPages: (routeIds: string[]) => Promise<void>
  prefetchPage: (name: string) => void
  setDevice: (device: ConfigurationDevice) => void
  setQuery: (query?: Record<string, any>, options?: SetQueryOptions) => boolean
  updateComponentAssets: (availableComponents: Components) => void
  updateExtension: (name: string, extension: Extension) => Promise<void>
  updateRuntime: (options?: PageContextOptions) => Promise<void>
  navigationRouteModifiers: Set<NavigationRouteModifier>
}

export interface RenderContextProps {
  runtime: RenderContext
}

export interface EmitterProps {
  __emitter: RenderContext['emitter']
}

export const RenderContext = React.createContext<RenderContext>({} as any)
RenderContext.displayName = 'RenderContext'

export const RenderContextProvider: React.FC<RenderContextProps> = ({
  children,
  runtime,
}) => (
  <RenderContext.Provider value={runtime}>{children}</RenderContext.Provider>
)
RenderContextProvider.displayName = 'RenderContextProvider'

export const useRuntime = (): RenderContext => {
  return useContext(RenderContext)
}

export const withRuntimeContext = <TOriginalProps extends {} = {}>(
  Component: ComponentType<TOriginalProps & RenderContextProps>
): ComponentType<TOriginalProps> => {
  const WithRuntimeContext = (props: TOriginalProps) => {
    const runtime = useRuntime()
    return <Component {...props} runtime={runtime} />
  }
  WithRuntimeContext.displayName = `withRuntimeContext(${
    Component.displayName || Component.name || 'Component'
  })`
  WithRuntimeContext.WrappedComponent = Component
  return hoistNonReactStatics<TOriginalProps, RenderContextProps>(
    WithRuntimeContext,
    Component
  )
}

export const withEmitter = <TOriginalProps extends {} = {}>(
  Component: ComponentType<TOriginalProps & EmitterProps>
): ComponentType<TOriginalProps> => {
  const WithEmitter = (props: TOriginalProps) => {
    const { emitter } = useRuntime()
    return <Component {...props} __emitter={emitter} />
  }
  WithEmitter.displayName = `withEmitter(${
    Component.displayName || Component.name || 'Component'
  })`
  WithEmitter.WrappedComponent = Component
  return hoistNonReactStatics<TOriginalProps, EmitterProps>(
    WithEmitter,
    Component
  )
}

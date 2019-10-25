import hoistNonReactStatics from 'hoist-non-react-statics'
import React, { ComponentType, useContext } from 'react'

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

export const useRuntime = () => {
  return useContext(RenderContext)
}

export const withRuntimeContext = <TOriginalProps extends {} = {}>(
  Component: ComponentType<TOriginalProps & RenderContextProps>
): ComponentType<TOriginalProps> => {
  const WithRuntimeContext = (props: TOriginalProps) => {
    const runtime = useRuntime()
    return <Component {...props} runtime={runtime} />
  }
  WithRuntimeContext.displayName = `withRuntimeContext(${Component.displayName ||
    Component.name ||
    'Component'})`
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
  WithEmitter.displayName = `withEmitter(${Component.displayName ||
    Component.name ||
    'Component'})`
  WithEmitter.WrappedComponent = Component
  return hoistNonReactStatics<TOriginalProps, EmitterProps>(
    WithEmitter,
    Component
  )
}

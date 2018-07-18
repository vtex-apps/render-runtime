import hoistNonReactStatics from 'hoist-non-react-statics'
import React, {ComponentType} from 'react'

export interface RenderContextProps {
  runtime: RenderContext
}

export interface EmitterProps {
  __emitter: RenderContext['emitter']
}

export const RenderContext = React.createContext<RenderContext>({} as any)

export const withRuntimeContext = <TOriginalProps extends {} = {}>(Component: ComponentType<TOriginalProps & RenderContextProps>): ComponentType<TOriginalProps> => {
  const ExtendedComponent = (props: TOriginalProps) => <RenderContext.Consumer>{runtime => <Component {...props} runtime={runtime} />}</RenderContext.Consumer>
  return hoistNonReactStatics<TOriginalProps, RenderContextProps>(ExtendedComponent, Component)
}

export const withEmitter = <TOriginalProps extends {} = {}>(Component: ComponentType<TOriginalProps & EmitterProps>): ComponentType<TOriginalProps> => {
  const ExtendedComponent = (props: TOriginalProps) => <RenderContext.Consumer>{runtime => <Component {...props} __emitter={runtime.emitter} />}</RenderContext.Consumer>
  return hoistNonReactStatics<TOriginalProps, EmitterProps>(ExtendedComponent, Component)
}

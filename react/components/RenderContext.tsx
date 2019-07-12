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
  const ExtendedComponent = (props: TOriginalProps) => (
    <RenderContext.Consumer>
      {runtime => <Component {...props} runtime={runtime} />}
    </RenderContext.Consumer>
  )
  ExtendedComponent.displayName = `ExtendedComponent(${Component.displayName ||
    Component.name ||
    'Component'})`
  return hoistNonReactStatics<TOriginalProps, RenderContextProps>(
    ExtendedComponent,
    Component
  )
}

export const withEmitter = <TOriginalProps extends {} = {}>(
  Component: ComponentType<TOriginalProps & EmitterProps>
): ComponentType<TOriginalProps> => {
  class WithEmitter extends React.Component<TOriginalProps> {
    public static get displayName(): string {
      return `WithEmitter(${Component.displayName ||
        Component.name ||
        'Component'})`
    }

    public render() {
      return (
        <RenderContext.Consumer>
          {runtime => <Component {...this.props} __emitter={runtime.emitter} />}
        </RenderContext.Consumer>
      )
    }
  }

  return hoistNonReactStatics<TOriginalProps, EmitterProps>(
    WithEmitter,
    Component
  )
}

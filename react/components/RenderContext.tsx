import hoistNonReactStatics from 'hoist-non-react-statics'
import React, {ComponentType} from 'react'

export interface RenderContextProps {
  runtime: RenderContext
}

export const RenderContext = React.createContext<RenderContext>({} as any)

export const withContext = <TOriginalProps extends {} = {}>(Component: ComponentType<TOriginalProps & RenderContextProps>): ComponentType<TOriginalProps> => {
  const ExtendedComponent = (props: TOriginalProps) => <RenderContext.Consumer>{runtime => <Component {...props} runtime={runtime} />}</RenderContext.Consumer>
  return hoistNonReactStatics<TOriginalProps, RenderContextProps>(ExtendedComponent, Component)
}

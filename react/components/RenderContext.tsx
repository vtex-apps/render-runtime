import hoistNonReactStatics from 'hoist-non-react-statics'
import React, {ComponentType} from 'react'

export interface RenderContextProps {
  runtime: RenderContext
}

export const RenderContext = React.createContext<RenderContext | undefined>(undefined)

export const withContext = <TOriginalProps extends {} = {}>(Component: ComponentType<TOriginalProps & RenderContextProps>): ComponentType<TOriginalProps> => {
  const ExtendedComponent = (props: TOriginalProps) => <RenderContext.Consumer>{runtime => <Component {...props} runtime={runtime!} />}</RenderContext.Consumer>
  hoistNonReactStatics<TOriginalProps, RenderContextProps>(ExtendedComponent, Component)
  return ExtendedComponent
}

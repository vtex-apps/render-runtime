import hoistNonReactStatics from 'hoist-non-react-statics'
import React, {ComponentType} from 'react'

export interface RenderContextProps {
  renderContext: RenderContext
}

export const RenderContext = React.createContext<RenderContext>({} as any)

export const withRenderContext = <TOriginalProps extends {} = {}>(Component: ComponentType<TOriginalProps & RenderContextProps>): ComponentType<TOriginalProps> => {
  const ExtendedComponent = (props: TOriginalProps) => <RenderContext.Consumer>{context => <Component {...props} renderContext={context} />}</RenderContext.Consumer>
  return hoistNonReactStatics<TOriginalProps, RenderContextProps>(ExtendedComponent, Component)
}

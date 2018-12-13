import hoistNonReactStatics from 'hoist-non-react-statics'
import React, { ComponentType } from 'react'
import Session, { SessionProps } from '../components/Session'

export const withSession = (options: SessionProps) => {
  // tslint:disable-next-line:only-arrow-functions
  return function <TOriginalProps>(Component: ComponentType<TOriginalProps>): ComponentType<TOriginalProps> {
    class WithSession extends React.Component<TOriginalProps> {
      public static get displayName(): string {
        return `WithSession(${Component.displayName || Component.name || 'Component'})`
      }

      public static get WrappedComponent() {
        return Component
      }

      public render() {
        return (
          <Session {...options}>
            <Component {...this.props} />
          </Session>
        )
      }
    }

    return hoistNonReactStatics<TOriginalProps, {}>(WithSession, Component)
  }
}

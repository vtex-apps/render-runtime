import PropTypes from 'prop-types'
import * as React from 'react'

const { Consumer, Provider } = React.createContext({
  dataLayer: [],
  set: () => undefined,
})

export const DataLayerProvider = ({ set, dataLayer, ...props }: DataLayerProps & any) => (
  <Provider value={{ set, dataLayer }} {...props} />
)

export interface DataLayerProps {
  dataLayer: object[]
  set(data: object) : undefined
}

export default function withDataLayer<P extends object>(WrappedComponent: React.ComponentType<P>) {
  return class DataLayer extends React.Component<P> {
    public static displayName =
      `DataLayer(${WrappedComponent.displayName || WrappedComponent.name})`

    public render() {
      return (
        <Consumer>
          {(context: DataLayerProps) => (
            <WrappedComponent {...this.props} {...context} />
          )}
        </Consumer>
      )
    }
  }
}

export const dataLayerProps = {
  dataLayer: PropTypes.array.isRequired,
  set: PropTypes.func.isRequired,
}

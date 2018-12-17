import hoistNonReactStatics from 'hoist-non-react-statics'
import PropTypes from 'prop-types'
import React, {ComponentType} from 'react'

const relative = (parent: string, id: string) => id.replace(`${parent}/`, '')

const isDirectChild = (id: string, parent: string) => {
  return id !== parent && (new RegExp(`^${parent}(/|\s)[a-zA-Z0-9-]+$`)).test(id)
}

const parseId = (id: string) => {
  const [, text, numericText] = /^(.*?)(\d+)?$/.exec(id)!
  const numbericValue = numericText ? parseInt(numericText, 10) : 0
  return [text, numbericValue]
}

export const getDirectChildren = (extensions: Extensions, treePath: string) => {
  return Object.entries(extensions)
    .filter(([id, extension]) => extension.component && isDirectChild(id, treePath))
    .map(([id]) => relative(treePath, id))
    .sort((idA, idB) => {
      const [textA, numberA] = parseId(idA)
      const [textB, numberB] = parseId(idB)
      const [valueA, valueB] = (textA === textB)
        ? [numberA, numberB]
        : [textA, textB]

      return valueA < valueB ? -1 : 1
    })
}

export const TreePathContext = React.createContext<TreePathProps>({treePath: ''})

export interface TreePathProps {
  treePath: string
}

export function withTreePath <TOriginalProps>(Component: ComponentType<TOriginalProps & TreePathProps>): ComponentType<TOriginalProps> {
  class TreePath extends React.Component<TOriginalProps, TreePathProps> {
    public static contextTypes = {
      treePath: PropTypes.string
    }

    public static get displayName(): string {
      return `TreePath(${Component.displayName || Component.name || 'Component'})`
    }

    public static get WrappedComponent() {
      return Component
    }

    public render() {
      return (
        <TreePathContext.Consumer>
          {
            context => {
              // get treePath from old react context during apollo's getDataFromTree
              // it is buggy when dealing with contexts that are overwritten, like treePath
              const treePath = window.__APOLLO_SSR__ ? this.context.treePath : context.treePath
              return <Component {...this.props} treePath={treePath}/>
            }
          }
        </TreePathContext.Consumer>
      )
    }
  }

  return hoistNonReactStatics<TOriginalProps, TreePathProps>(TreePath, Component)
}

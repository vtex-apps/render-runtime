import hoistNonReactStatics from 'hoist-non-react-statics'
import PropTypes from 'prop-types'
import React, {ComponentClass, ComponentType} from 'react'

const relative = (parent: string, id: string) => id.replace(`${parent}/`, '')

const isDirectChild = (id: string, parent: string) => {
  return id !== parent && (new RegExp(`^${parent}/[a-zA-Z0-9-]+$`)).test(id)
}

export const getDirectChildren = (extensions: Extensions, treePath: string) => {
  return Object.entries(extensions)
    .filter(([id, extension]) => extension.component && isDirectChild(id, treePath))
    .map(([id]) => relative(treePath, id))
    .sort()
}

export const TreePathContext = React.createContext<TreePathProps>({treePath: ''})

export interface TreePathProps {
  treePath: string
}

export const withTreePath = <TOriginalProps extends {id: string}>(Component: ComponentType<TOriginalProps & TreePathProps>, provider: boolean = false): ComponentType<TOriginalProps> => {
  class TreePath extends React.Component<TOriginalProps, TreePathProps> {
    public static contextTypes = {
      treePath: PropTypes.string
    }

    public static childContextTypes = {
      treePath: PropTypes.string
    }

    public static get displayName(): string {
      return `TreePath(${Component.displayName || Component.name || 'Component'})`
    }

    public static get WrappedComponent() {
      return Component
    }

    private static getId (currentId: string, parentTreePath: string) {
      return parentTreePath ? `${parentTreePath}/${currentId}` : currentId
    }

    public componentWillMount() {
      this.componentWillReceiveProps(this.props, this.context)
    }

    public componentWillReceiveProps(nextProps: TOriginalProps, nextContext: TreePathProps) {
      this.setState({
        treePath: provider
          ? TreePath.getId(nextProps.id, nextContext.treePath)
          : nextContext.treePath
      })
    }

    public getChildContext() {
      return { treePath: this.state.treePath }
    }

    public render() {
      return (
        <TreePathContext.Consumer>
          {
            context => {
              const treePath = TreePath.getId(this.props.id, context.treePath)
              return provider
                ? (
                  <TreePathContext.Provider value={{treePath}}>
                    <Component {...this.props} treePath={treePath}/>
                  </TreePathContext.Provider>
                ) : (
                  <Component {...this.props} treePath={treePath}/>
                )
            }
          }
        </TreePathContext.Consumer>
      )
    }
  }

  return hoistNonReactStatics<TOriginalProps, TreePathProps>(TreePath, Component)
}

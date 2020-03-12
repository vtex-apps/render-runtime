import hoistNonReactStatics from 'hoist-non-react-statics'
import React, { ComponentType, useContext, FC, useMemo } from 'react'

const relative = (parent: string, id: string) => id.replace(`${parent}/`, '')

export const escapeRegex = (s: string) =>
  s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')

export const isDirectChild = (id: string, parent: string) => {
  return (
    id !== parent &&
    new RegExp(`^${escapeRegex(parent)}/[a-zA-Z0-9-_#]+$`).test(id)
  )
}

const parseId = (id: string) => {
  const matches = /^(.*?)(\d+)?$/.exec(id)

  if (matches === null) {
    return []
  }

  const [, text, numericText] = matches
  const numbericValue = numericText ? parseInt(numericText, 10) : 0
  return [text, numbericValue]
}

export const getDirectChildren = (extensions: Extensions, treePath: string) => {
  return Object.entries(extensions)
    .filter(
      ([id, extension]) => extension.component && isDirectChild(id, treePath)
    )
    .map(([id]) => relative(treePath, id))
    .sort((idA, idB) => {
      const [textA, numberA] = parseId(idA)
      const [textB, numberB] = parseId(idB)
      const [valueA, valueB] =
        textA === textB ? [numberA, numberB] : [textA, textB]

      return valueA < valueB ? -1 : 1
    })
}

export const TreePathContext = React.createContext<TreePathProps>({
  treePath: '',
})
TreePathContext.displayName = 'TreePathContext'

export const TreePathContextProvider: FC<TreePathProps> = ({
  treePath,
  children,
}) => {
  const value = useMemo(() => ({ treePath }), [treePath])
  return (
    <TreePathContext.Provider value={value}>
      {children}
    </TreePathContext.Provider>
  )
}
TreePathContextProvider.displayName = 'TreePathContextProvider'

export const useTreePath = () => {
  return useContext(TreePathContext)
}

export interface TreePathProps {
  treePath: string
}

export function withTreePath<TOriginalProps>(
  Component: ComponentType<TOriginalProps & TreePathProps>
): ComponentType<TOriginalProps> {
  const WithTreePath = (props: TOriginalProps) => {
    const { treePath } = useTreePath()
    return <Component {...props} treePath={treePath} />
  }

  WithTreePath.displayName = `TreePath(${Component.displayName ||
    Component.name ||
    'Component'})`
  WithTreePath.WrappedComponent = Component

  return hoistNonReactStatics<TOriginalProps, TreePathProps>(
    WithTreePath,
    Component
  )
}

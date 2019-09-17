import { ReactElement, useReducer } from 'react'
import { createContainer } from 'react-tracked'

import { useTreePath } from '../utils/treePath'

function mountTreePath(base: string, children: string[]) {
  return [base, ...children].filter(id => !!id).join('/')
}

interface Options {
  children?: string[] | string
}

export interface ExtensionsDispatchAction {
  type: 'update'
  extensions: RenderRuntime['extensions']
}

const reducer = (
  state: RenderRuntime['extensions'],
  action: ExtensionsDispatchAction
): RenderRuntime['extensions'] => {
  let newExtensions = {}
  switch (action.type) {
    case 'update':
      newExtensions = {
        ...state,
        ...action.extensions,
      }
      if (window) {
        window.__RUNTIME__.extensions = newExtensions
      }
      return newExtensions
    default:
      throw new Error('unknown action')
  }
}

const {
  Provider: ExtensionsProvider,
  useTracked: useTrackedExtensions,
  useUpdate: useDispatchTrackedExtensions,
  useTrackedState: useTrackedExtensionsState,
} = createContainer(
  ({ initialState }: { initialState: Extensions } = { initialState: {} }) =>
    useReducer(reducer, initialState)
)

const useExtension = ({ children }: Options = {}): Extension | null => {
  const extensions = useTrackedExtensionsState()

  const { treePath: baseTreePath } = useTreePath()

  const treePath = children
    ? mountTreePath(
        baseTreePath,
        Array.isArray(children) ? children : [children]
      )
    : baseTreePath

  const extension = treePath && extensions[treePath]

  return extension || null
}

interface ExtensionContext {
  extension?: Extension | null
}

interface Props {
  children({ extension }: ExtensionContext): ReactElement<any> | null
}

const ExtensionConsumer = ({ children }: Props) => {
  const extension = useExtension()

  return children({ extension })
}

interface ExtensionsProviderRenderProps {
  children: (
    arg: ReturnType<typeof useDispatchTrackedExtensions>
  ) => React.ReactElement
}

const ExtensionsProviderRender: React.FC<ExtensionsProviderRenderProps> = ({
  children,
}) => {
  const dispatchExtensions = useDispatchTrackedExtensions()

  return children(dispatchExtensions)
}

export {
  useExtension,
  ExtensionConsumer,
  ExtensionsProvider,
  useTrackedExtensions,
  useTrackedExtensionsState,
  ExtensionsProviderRender,
}

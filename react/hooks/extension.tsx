import { ReactElement } from 'react'

import { useRuntime } from '../components/RenderContext'
import { useTreePath } from '../utils/treePath'
import { Extension } from '../typings/runtime'

function mountTreePath(base: string, children: string[]) {
  return [base, ...children].filter((id) => !!id).join('/')
}

interface Options {
  children?: string[] | string
}

const useExtension = ({ children }: Options = {}): Extension | null => {
  const { extensions } = useRuntime()

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

export { useExtension, ExtensionConsumer }

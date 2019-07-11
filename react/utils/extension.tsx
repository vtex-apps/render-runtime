import { ReactElement } from 'react'

import { useRuntime } from '../components/RenderContext'

const useExtension = (treePath: string) => {
  const runtime = useRuntime()
  const { extensions } = runtime

  const extension = treePath && extensions[treePath]

  return extension || null
}

interface ExtensionContext {
  extension?: Extension | null
}

interface Props {
  children({ extension }: ExtensionContext): ReactElement<any> | null
  treePath: string
}

const ExtensionConsumer = ({ children, treePath }: Props) => {
  const extension = useExtension(treePath)

  return children({ extension })
}

export { useExtension, ExtensionConsumer }

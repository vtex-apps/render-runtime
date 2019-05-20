import { ReactElement } from 'react'

import { useRuntime } from '../components/RenderContext'
import { useTreePath } from './treePath'

const useExtension = () => {
  const runtime = useRuntime()
  const { extensions } = runtime

  const { treePath } = useTreePath()

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

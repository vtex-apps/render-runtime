import { useRuntime } from './RenderContext'
import type { RenderContext } from './RenderContext'

type PublicRuntime = Pick<
  RenderContext,
  | 'account'
  | 'binding'
  | 'culture'
  | 'deviceInfo'
  | 'getSettings'
  | 'hints'
  | 'history'
  | 'navigate'
  | 'page'
  | 'production'
  | 'query'
  | 'renderMajor'
  | 'rootPath'
  | 'setQuery'
  | 'workspace'
>

const usePublicRuntime = useRuntime as () => PublicRuntime

export default usePublicRuntime

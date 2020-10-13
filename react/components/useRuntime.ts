import { useRuntime } from './RenderContext'
import type { RenderContext } from './RenderContext'

type PublicRuntime = Pick<
  RenderContext,
  | 'account'
  | 'amp'
  | 'binding'
  | 'culture'
  | 'device'
  | 'getSettings'
  | 'hints'
  | 'history'
  | 'navigate'
  | 'page'
  | 'platform'
  | 'production'
  | 'publicEndpoint'
  | 'query'
  | 'renderMajor'
  | 'rootPath'
  | 'route'
  | 'workspace'
>

const usePublicRuntime = useRuntime as () => PublicRuntime

export default usePublicRuntime

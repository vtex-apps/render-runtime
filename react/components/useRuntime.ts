import { RenderRuntime } from '../typings/runtime'
import { useRuntime, RenderContextType } from './RenderContext'

type PublicRuntime = Pick<
  RenderContextType,
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

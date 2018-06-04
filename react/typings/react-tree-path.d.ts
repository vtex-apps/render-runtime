declare module 'react-tree-path' {
  import {ComponentClass, ComponentType} from "react"

  export interface TreePathProps {
    treePath: string
  }

  interface Wrapper {
    <TOriginalProps extends {}>(Component: ComponentClass<TOriginalProps & TreePathProps>): ComponentClass<TOriginalProps>
  }

  var withTreePath: Wrapper
  export default withTreePath
}

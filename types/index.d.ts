declare module 'vtex.render-runtime' {
  export interface RenderRuntime {
    foo: 'bar'
  }

  export function useRuntime(): RenderRuntime

  interface ChildBlock {

  }

  export function useChildBlock(): ChildBlock
}

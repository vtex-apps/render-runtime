interface Module {
  hot: any
}

declare const module: Module

declare module '*.graphql' {
  import { DocumentNode } from 'graphql'

  const value: DocumentNode
  export default value
}

declare module '*.png' {
  let url: string
  export = url
}

declare module '*.css' {
  const content: any
  export default content
}

declare const vtex: any

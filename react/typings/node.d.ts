interface Module {
  hot: any
}

declare var module: Module

declare module '*.graphql' {
  import { DocumentNode } from 'graphql'

  const value: DocumentNode
  export default value
}

declare module '*.png' {
  var url: string
  export = url
}

declare module '*.css' {
  const content: any
  export default content
}

declare var vtex: any

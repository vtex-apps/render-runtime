interface Module {
  hot: any
}

declare const module: Module

declare module '*.graphql' {
  const value: any
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

interface Module {
  hot: any
}

declare var global: Window

declare var module: Module

declare module '*.graphql' {
  import {DocumentNode} from 'graphql';

  const value: DocumentNode;
  export default value;
}

declare module '*.png' {
  var url: string
  export = url
}

declare var vtex: any

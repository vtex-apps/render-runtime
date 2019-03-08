declare module 'isbot' {
  interface isBot {
    extend(additionalFilters: string[]): void
    (userAgent: string): boolean
  }

  var func: isBot
  export = func
}

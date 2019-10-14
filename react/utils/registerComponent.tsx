import { path } from 'ramda'
import { ComponentType } from 'react'

import maybeWrapWithHMR from './withHMR'

const calledComponents: Record<string, any> = {}

export const isComponentType = (Arg: any): Arg is ComponentType => {
  const isFunction = typeof Arg === 'function'

  /** If Arg is a function, assumes an UpperCamelCase naming convention
   * for components, and lowerCamelCase for functions.
   * (See https://reactjs.org/docs/jsx-in-depth.html#user-defined-components-must-be-capitalized)
   * If the function name is unable to be determined, defaults
   * to true (i.e. assumes the function is probably a component)
   *
   * This is needed so that functions exported on IO (e.g. HOC) don't
   * get treated as components, so they can be callable.
   */
  if (isFunction) {
    const name: string | undefined = path(
      ['prototype', 'constructor', 'name'],
      Arg
    )
    if (!name) {
      return true
    }

    const firstChar = name.charAt(0)

    if (!firstChar || firstChar === '') {
      return true
    }

    const isFirstCharUpperCase = firstChar.toUpperCase() === firstChar

    return isFirstCharUpperCase
  }

  return !!(Arg && Arg.prototype && Arg.prototype.render)
}

const idToAppAtMajor = (appId: string) => {
  const [name, version] = appId.split('@')
  const [major] = version.split('.')
  return `${name}@${major}.x`
}

export default (
  module: Module,
  InitialImplementer: any,
  app: string,
  name: string,
  lazy: boolean = false
) => {
  const componentLocators = [`${app}/${name}`, `${idToAppAtMajor(app)}/${name}`]

  if (module.hot || !lazy) {
    const wrappedComponent = maybeWrapWithHMR(module, InitialImplementer)
    componentLocators.forEach(componentLocator => {
      window.__RENDER_8_COMPONENTS__[componentLocator] = wrappedComponent
    })

    return wrappedComponent
  }

  componentLocators.forEach(componentLocator => {
    Object.defineProperty(window.__RENDER_8_COMPONENTS__, componentLocator, {
      get: () => {
        const foundLocator = componentLocators.find(
          componentLocator => calledComponents[componentLocator]
        )
        return foundLocator
          ? calledComponents[foundLocator]
          : (calledComponents[componentLocator] = InitialImplementer())
      },
    })
  })

  return InitialImplementer
}

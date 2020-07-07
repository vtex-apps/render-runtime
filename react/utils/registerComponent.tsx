import { path } from 'ramda'
import { ComponentType } from 'react'

import maybeWrapWithHMR from './withHMR'

const loadedComponents: Record<string, { implementer: any }> = {}

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

export const getLoadedComponent = (componentLocator: string) => {
  return (
    loadedComponents[componentLocator] &&
    loadedComponents[componentLocator].implementer
  )
}

export default (
  module: Module,
  InitialImplementer: any,
  app: string,
  name: string,
  lazy = false
) => {
  const locators = [`${app}/${name}`, `${idToAppAtMajor(app)}/${name}`]
  const eager = module.hot || !lazy
  let implementer = InitialImplementer

  if (eager) {
    const evaluatedImplementer = lazy
      ? InitialImplementer()
      : InitialImplementer
    implementer = maybeWrapWithHMR(module, evaluatedImplementer)
  }

  locators.forEach((locator) => {
    if (window.__RENDER_8_COMPONENTS__[locator]) {
      return
    }

    if (eager) {
      window.__RENDER_8_COMPONENTS__[locator] = implementer
      loadedComponents[locator] = { implementer }
    } else {
      Object.defineProperty(window.__RENDER_8_COMPONENTS__, locator, {
        get: () => {
          if (loadedComponents[locator]) {
            return loadedComponents[locator].implementer
          }

          const evaluatedImplementer = implementer()
          locators.forEach((eachLocator) => {
            loadedComponents[eachLocator] = {
              implementer: evaluatedImplementer,
            }
          })

          return evaluatedImplementer
        },
      })
    }
  })

  return implementer
}

import { useMemo } from 'react'
import { generateBlockClass } from '@vtex/css-handles'
import { useOwnerBlock } from '../components/OwnerBlock'

/**
 * Useful for creating CSS handles without creating a CSS file with empty
 * declarations.
 * Receives an array of strings (e.g. ['foo', 'bar']) or an enum
 * (e.g. enum Handles {foo, bar}) and returns and object with
 * generated css class names. For example:
 * { foo: 'vendor-appname-1-x-foo', bar: 'vendor-appname-1-x-bar' }.
 */
export const useOwnerBlockCssHandles = <T extends CssHandlesInput>(
  handles: T
): CssHandles<T> => {
  const { identifier, props } = useOwnerBlock()

  const blockClass = props && (props.cssHandle || props.blockClass)

  const values = useMemo<CssHandles<T>>(() => {
    const namespace = identifier && identifier.replace(/\.|@/g, '-')

    // Intended for when the input is an Enum. Converts it to an array of its keys
    const normalizedHandles: string[] = Array.isArray(handles)
      ? handles
      : Object.keys(handles)

    return normalizedHandles.reduce<Record<string, string>>((acc, handle) => {
      if (validateCssHandle) {
        acc[handle] = namespace
          ? generateBlockClass(`${namespace}-${handle}`, blockClass)
          : ''
      } else {
        console.error(
          `Invalid CSS handle "${handle}". It should only contain letters or numbers, and should start with a letter.`
        )
      }

      return acc
    }, {}) as CssHandles<T>
  }, [identifier, blockClass, handles])

  return values
}

/** Verifies if the handle contains only letters and numbers,
 * and doesn't begin with a number  */
const validateCssHandle = (handle: string) => !/^\d|[^A-z0-9]/.test(handle)

type ValueOf<T extends readonly any[]> = T[number]

type CssHandlesInput = readonly string[] | Record<string, any>
type CssHandles<T extends CssHandlesInput> = T extends readonly string[]
  ? Record<ValueOf<T>, string>
  : Record<keyof T, string>

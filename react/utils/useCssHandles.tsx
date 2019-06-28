import { useMemo } from 'react'
import { useOwnerBlock } from '../components/OwnerBlock'

/**
 * Useful for creating CSS handles without creating a CSS file with empty
 * declarations.
 * Receives an array of strings ('foo', 'bar') and returns an object with
 * { foo: 'vendor-appname-1-x-foo', bar: 'vendor-appname-1-x-bar' }.
 */
export const useOwnerBlockCssHandles = (handles: string[] = []): CssHandles => {
  const { identifier } = useOwnerBlock()

  const values = useMemo(() => {
    if (!identifier) {
      const fallbackValues = useMemo(() => {
        return handles.reduce((acc: { [key: string]: string }, handle) => {
          acc[handle] = ''
          return acc
        }, {})
      }, [handles])

      return fallbackValues
    }

    const namespace = identifier
      .replace(/\./gi, '-')
      .replace('@', '-')

    return handles.reduce((acc: { [key: string]: string }, handle) => {
      acc[handle] = namespace + '-' + handle
      return acc
    }, {})
  }, [identifier, handles])

  return values
}

interface CssHandles {
  [key: string]: string
}

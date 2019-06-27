import { useMemo } from 'react'
import { useHostExtension } from '../components/HostExtension'

/**
 * Useful for creating CSS handles without creating a CSS file with empty
 * declarations.
 * Receives an array of strings ('foo', 'bar') and returns an object with
 * { foo: 'vendor-appname-1-x-foo', bar: 'vendor-appname-1-x-bar' }.
 */
const useCssHandles = (handles: string[] = []): { [key: string]: string } => {
  const { identifier } = useHostExtension()

  if (!identifier) {
    // Fallback to empty strings
    const fallbackValues = useMemo(() => {
      return handles.reduce((acc: { [key: string]: string }, handle) => {
        acc[handle] = ''
        return acc
      }, {})
    }, [handles])

    return fallbackValues
  }

  const values = useMemo(() => {
    const namespace = identifier
      .replace(/\./gi, '-')
      .replace('@', '-')

    return handles.reduce((acc: { [key: string]: string }, handle) => {
      acc[handle] = namespace + '-' + handle
      return acc
    }, {})
  }, [handles])

  return values
}

export default useCssHandles

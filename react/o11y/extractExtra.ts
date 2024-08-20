/**
 * This method extracts keys from objects iteratively
 * and adpat them to the format required by Sentry to log
 * events from the Admin by following our conventions.
 *
 * Sentry doesn't log all the keys from an object
 * when an error is captured, so we need to extract
 * the keys and values from the error object and
 * adapt them to the format required by Sentry ourselves
 * in order to make them indexable and searchable.
 *
 * This helps us aggregate and filter errors in Sentry by
 * dynamically generating keys.
 */
export function extractExtra(err: any) {
  try {
    const extra: any = {}

    return iterate(err, extra, 0, new Set())
  } catch (error) {
    return {}
  }
}

/**
 * This function is recursive and will iterate over the
 * object's keys and values to extract them and adapt
 * them to the format required by Sentry.
 */
function iterate(
  err: any,
  extra: any,
  iterationNumber: number,
  seen: Set<any>
) {
  if (typeof err === 'object') {
    // We don't want to rely on the browser's ability
    // to handle memory leaks when dealing with circular
    // references, so we need to keep track of the keys
    // we've already seen to avoid infinite loops.
    if (seen.has(err)) {
      throw new Error('Circular reference detected')
    }
    seen.add(err)

    for (const key in err) {
      if (typeof err[key] === 'object') {
        const updatedExtra = iterate(err[key], extra, iterationNumber + 1, seen)
        extra = { ...extra, ...updatedExtra }
      } else {
        if (typeof err[key] !== 'function') {
          const value = err[key]

          // Split values that are too long into as many parts as necessary to fit
          // Sentry's limit of 200 characters per value
          if (value.length >= 200) {
            const chunks = []
            for (let chunk = 0; chunk < value.length; chunk += 199) {
              chunks.push(value.substr(chunk, 199))
            }

            for (let chunk = 0; chunk < chunks.length; chunk++) {
              extra[
                `admin_extra_level_${iterationNumber}_` + key + '_' + chunk
              ] = chunks[chunk]
            }
          } else {
            extra[`admin_extra_level_${iterationNumber}_` + key] = err[key]
          }
        }
      }

      seen.delete(err)
    }
  } else {
    return err
  }

  return extra
}

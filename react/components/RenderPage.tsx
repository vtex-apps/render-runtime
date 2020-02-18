import React, { FC } from 'react'
import ExtensionPoint from './ExtensionPoint'
import MaybeContext from './MaybeContext'
import { useRuntime } from './RenderContext'

interface Props {
  page: string
  query?: Record<string, string>
}

const RenderPage: FC<Props> = props => {
  const runtime = useRuntime()
  const { page, query } = props
  const {
    route: { params },
  } = runtime

  /** Will use the params of the page as a key for the component, so React will
   * unmount and remount it on page change. This is used to reset components
   * to their initial state on page change, to better simulate how regular
   * web pages work. */
  let paramsString = ''

  /** TODO: This is a quick fix--the admin, which runs on an iframe, doesn't play
   * nice with unmounting/remounting. Should perhaps try and find a better solution
   * for this issue. */
  if (!page?.startsWith('admin.')) {
    try {
      paramsString = JSON.stringify(params)
    } catch (e) {
      console.warn(
        "Unable to stringify params for page. This shouldn't be much of a problem, but might prevent components from being reset on page change. The params object is as follows:",
        params
      )
    }
  }

  return (
    <MaybeContext
      nestedPage={page}
      query={query}
      params={params}
      runtime={runtime}
    >
      <ExtensionPoint
        // Key used to unmount/remount the component on page change.
        key={`${page}/${paramsString}`}
        id={page}
        query={query}
        params={params}
        {...props}
      />
    </MaybeContext>
  )
}

export default RenderPage

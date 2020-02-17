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

  let paramsString = ''

  try {
    paramsString = JSON.stringify(params)
  } catch (e) {
    console.warn(
      "Unable to stringify params for page. This shouldn't be much of a problem, but might prevent components from being reset on page change. The params object is as follows:",
      params
    )
  }

  return (
    <MaybeContext
      nestedPage={page}
      query={query}
      params={params}
      runtime={runtime}
    >
      <ExtensionPoint
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

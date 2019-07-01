import React from 'react'
import ExtensionPoint from './ExtensionPoint'
import MaybeContext from './MaybeContext'
import { useRuntime } from './RenderContext'

interface Props {
  page: string
  query?: Record<string, string>
}

function RenderPage(props: Props) {
  const runtime = useRuntime()
  const {
    route: { params },
  } = runtime
  const { page, query } = props

  return (
    <MaybeContext
      nestedPage={page}
      query={query}
      params={params}
    >
      <ExtensionPoint
        id={page}
        query={query}
        params={params}
        treePath=""
        {...props}
      />
    </MaybeContext>
  )
}

export default RenderPage

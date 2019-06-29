import React, { FC, memo } from 'react'
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
  const { route: { params } } = runtime

  return (
    <MaybeContext
      nestedPage={page}
      query={query}
      params={params}
      runtime={runtime}
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


import React, { FC, memo } from 'react'
import ExtensionPoint from './ExtensionPoint'
import MaybeContext from './MaybeContext'
import { useRuntime } from './RenderContext'

interface Props {
  page: string
  query?: Record<string, string>
}

const RenderPage: FC<Props> = props => {
  const { page, query } = props
  const { route: { params } } = useRuntime()
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
        {...props}
      />
    </MaybeContext>
  )
}

export default memo(RenderPage)

import React from 'react'
import ExtensionPoint from './ExtensionPointFC'
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
  // return (
  //   <RenderContext.Consumer>
  //     {runtime => {
  //       const {
  //         route: { params },
  //       } = runtime
  //       const { page, query } = props
  //       return (
  //         <MaybeContext
  //           nestedPage={page}
  //           query={query}
  //           params={params}
  //           runtime={runtime}
  //         >
  //           <ExtensionPoint
  //             id={page}
  //             query={query}
  //             params={params}
  //             {...props}
  //           />
  //         </MaybeContext>
  //       )
  //     }}
  //   </RenderContext.Consumer>
  // )
}
export default RenderPage

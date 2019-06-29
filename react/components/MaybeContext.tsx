import React, { useMemo, Fragment, FC } from 'react'
import ExtensionPointComponent from '../components/ExtensionPointComponent'
import { useRuntime } from './RenderContext'

interface Props {
  nestedPage: string
  params?: Record<string, any>
  query?: Record<string, string>
}

const useContextComponent = ({ nestedPage, query, params }: Props) => {
  const { extensions } = useRuntime()
  const { context, props: pageProps } = extensions[nestedPage]
  const pageContextProps = pageProps && pageProps.context
  const contextProps = useMemo(() => {
    if (!context) {
      return undefined
    }
    return {
      pageContextProps,
      nextTreePath: nestedPage,
      params,
      query,
      ...context.props,
    }
  }, [context, nestedPage, params, query, pageContextProps])
  const contextComponent = context ? context.component : undefined
  return [contextProps, contextComponent]
}

const MaybeContext: FC<Props> = ({ children, nestedPage, query, params }) => {
  const runtime = useRuntime()

  const [contextProps, contextComponent] = useContextComponent({ nestedPage, query, params })

  return contextComponent ? (
    <ExtensionPointComponent
      component={contextComponent}
      props={contextProps}
      runtime={runtime}
      treePath={nestedPage}
    >
      {children}
    </ExtensionPointComponent>
  ) : (
    <Fragment>
      {children}
    </Fragment>
  )
}

export default MaybeContext

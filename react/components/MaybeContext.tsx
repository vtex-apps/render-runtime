import React, { useMemo, Fragment, FC } from 'react'
import ExtensionPointComponent from '../components/ExtensionPointComponent'
import { useRuntime, RenderContextProps } from './RenderContext'

interface Props extends RenderContextProps{
  nestedPage: string
  params?: Record<string, any>
  query?: Record<string, string>
}

const useContextComponent = ({ nestedPage, query, params, runtime }: Props & RenderContextProps) => {
  const { extensions } = runtime

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

const MaybeContext: FC<Props> = ({ children, nestedPage, query, params, runtime }) => {
  const [contextProps, contextComponent] = useContextComponent({
    nestedPage,
    query,
    params,
    runtime,
  })

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

import React, { useMemo, Fragment, FC } from 'react'
import ExtensionPointComponent from '../components/ExtensionPointComponent'
import { RenderContextProps } from './RenderContext'
import { useTrackedExtensionsState } from '../hooks/extension'

interface Props extends RenderContextProps {
  nestedPage: string
  params?: Record<string, any>
  query?: Record<string, string>
}

const useContextComponent = ({
  nestedPage,
  query,
  params,
}: Omit<Props, 'runtime'>) => {
  const extensions = useTrackedExtensionsState()

  const { context, props: pageProps } = extensions[nestedPage] || {
    context: undefined,
    props: undefined,
  }

  const pageContextProps = pageProps && pageProps.context

  const contextProps = useMemo(() => {
    if (!context) {
      return undefined
    }
    return {
      ...pageContextProps,
      nextTreePath: nestedPage,
      params,
      query,
      ...context.props,
    }
  }, [context, nestedPage, params, query, pageContextProps])
  const contextComponent = context ? context.component : undefined
  return [contextProps, contextComponent]
}

const MaybeContext: FC<Props> = ({
  children,
  nestedPage,
  query,
  params,
  runtime,
}) => {
  const [contextProps, contextComponent] = useContextComponent({
    nestedPage,
    query,
    params,
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
    <Fragment>{children}</Fragment>
  )
}

export default MaybeContext

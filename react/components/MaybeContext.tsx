import React, { useMemo, Fragment, FC } from 'react'
import ExtensionPointComponent from '../components/ExtensionPointComponent'
import { RenderContextProps } from './RenderContext'
import { ExtensionPoint } from '../core/main'

interface Props extends RenderContextProps {
  nestedPage: string
  params?: Record<string, any>
  query?: Record<string, string>
}

const useContextComponent = ({
  nestedPage,
  query,
  params,
  runtime,
}: Props & RenderContextProps) => {
  const { extensions } = runtime

  const { context, before, after, props: pageProps } = extensions[nestedPage]
  const pageContextProps = pageProps && pageProps.context

  /** Allows rendering header/footer if the Context component is loading,
   * by exposing them to ExtensionPointComponent via props.
   * TODO:This is a bit of a hack. The header/footer should probably be decoupled
   * from the context, but doing so introduces bugs on some stores. */
  const beforeElements =
    before &&
    before.map(beforeId => (
      <ExtensionPoint id={beforeId} key={beforeId} treePath={nestedPage} />
    ))

  const afterElements =
    after &&
    after.map(afterId => (
      <ExtensionPoint id={afterId} key={afterId} treePath={nestedPage} />
    ))

  const contextProps = useMemo(() => {
    if (!context) {
      return undefined
    }
    return {
      ...pageContextProps,
      beforeElements,
      afterElements,
      nextTreePath: nestedPage,
      params,
      query,
      ...context.props,
    }
  }, [
    context,
    pageContextProps,
    beforeElements,
    afterElements,
    nestedPage,
    params,
    query,
  ])
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
    runtime,
  })

  return contextComponent ? (
    <ExtensionPointComponent
      component={contextComponent}
      props={contextProps}
      runtime={runtime}
      treePath={nestedPage}
      hydration="always"
    >
      {children}
    </ExtensionPointComponent>
  ) : (
    <Fragment>{children}</Fragment>
  )
}

export default MaybeContext

import React, { useEffect, useState, FunctionComponent } from 'react'

import { getImplementation } from '../utils/assets'
import GenericPreview from './Preview/GenericPreview'
import Loading from './Loading'
import { TreePathContextProvider } from '../utils/treePath'
import { isSiteEditorIframe } from '../utils/dom'
import SiteEditorWrapper from './ExtensionPoint/SiteEditorWrapper'
import Hydration from './Hydration'
import { LazyImages } from './LazyImages'
import { useSlots } from '../utils/slots'

const componentPromiseMap: any = {}
const componentPromiseResolvedMap: any = {}

interface Props {
  component: string | null
  componentProps: Record<string, any>
  treePath: string
  runtime: RenderContext
  hydration: Hydration
}

export async function fetchComponent(
  component: string,
  runtimeFetchComponent: RenderContext['fetchComponent'],
  retries = 3
): Promise<any> {
  const Component = getImplementation(component)

  if (Component) {
    return Component
  }

  if (!(component in componentPromiseMap)) {
    componentPromiseMap[component] = runtimeFetchComponent(component)
  } else if (componentPromiseResolvedMap[component]) {
    /** These retries perhaps are not needed anymore, but keeping just to be safe */
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return fetchComponent(component, runtimeFetchComponent, retries - 1)
    }

    /* Loading was completed but the component was not registered.
     * This means something wrong happened */
    throw new Error(`Unable to fetch component ${component}`)
  }

  await componentPromiseMap[component]

  componentPromiseResolvedMap[component] = true

  return getImplementation(component)
}

const AsyncComponent: FunctionComponent<Props> = (props) => {
  const { component, componentProps, children, treePath, runtime } = props

  const isRootTreePath = treePath.indexOf('/') === -1
  const isAround = treePath.indexOf('$around') !== -1

  const [Component, setComponent] = useState(
    () => getImplementation(component) ?? null
  )

  useEffect(() => {
    // Does nothing if Component is loaded...
    // (or if component is nil)
    if (Component || !component) {
      return
    }

    // ...otherwise, fetches it and stores the result in the Component state
    fetchComponent(component, runtime.fetchComponent).then((result) => {
      if (Component) {
        return
      }
      setComponent(() => result)
    })
  }, [Component, component, runtime.fetchComponent])

  if (Component) {
    return <Component {...componentProps}>{children}</Component>
  }

  /** If the component is not loaded yet, renders a "loading"
   * state. This currently only applies to root components
   * (e.g. "store.home") */
  if (isRootTreePath || isAround) {
    return (
      <>
        {componentProps.beforeElements}
        <GenericPreview />
        {componentProps.afterElements}
      </>
    )
  }

  return <Loading />
}

export const WrappedComponent: FunctionComponent<Props> = ({
  component,
  componentProps = {},
  treePath,
  hydration,
  runtime,
  children,
}) => {
  const slotProps = useSlots({
    props: componentProps,
    hydration,
    treePath,
  })

  const Component = getImplementation(component)

  if (Component) {
    return (
      <Component {...componentProps} {...slotProps}>
        {children}
      </Component>
    )
  }

  return (
    <AsyncComponent
      component={component}
      componentProps={{ ...componentProps, ...slotProps }}
      treePath={treePath}
      runtime={runtime}
      hydration={hydration}
    >
      {children}
    </AsyncComponent>
  )
}

const ComponentLoader: FunctionComponent<Props> = (loaderProps) => {
  const { component, treePath, hydration } = loaderProps

  if (component?.includes('Fold')) {
    return null
  }

  const shouldHydrate =
    !hydration ||
    hydration === 'always' ||
    /** TODO: Currently it only applies partial hydration on top level components
     * Nested partial hydration should be supported in the future */
    /** (using indexOf instead of regex for performance
     * https://jsperf.com/js-regex-match-vs-substring) */
    treePath?.substring(treePath?.indexOf('/') + 1).indexOf('/') > -1
  let content = <WrappedComponent {...loaderProps} />

  if (!isSiteEditorIframe && !shouldHydrate) {
    content = (
      <LazyImages>
        <Hydration treePath={treePath} hydration={hydration}>
          {content}
        </Hydration>
      </LazyImages>
    )
  }

  content = (
    <TreePathContextProvider treePath={treePath}>
      {content}
    </TreePathContextProvider>
  )

  if (isSiteEditorIframe) {
    content = <SiteEditorWrapper {...loaderProps}>{content}</SiteEditorWrapper>
  }

  return content
}

export default ComponentLoader

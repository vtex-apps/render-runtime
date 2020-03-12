import React, { useEffect, useState, FunctionComponent } from 'react'
import { getImplementation } from '../../utils/assets'
import GenericPreview from '../Preview/GenericPreview'
import Loading from '../Loading'
import { TreePathContextProvider } from '../../utils/treePath'
import { isSiteEditorIframe } from '../../utils/dom'
import SiteEditorWrapper from './SiteEditorWrapper'
import Hydration from '../Hydration'

const componentPromiseMap: any = {}
const componentPromiseResolvedMap: any = {}

async function fetchComponent(
  component: string,
  fetchComponent: RenderContext['fetchComponent']
) {
  const Component = component && getImplementation(component)

  if (Component) {
    return Component
  }

  if (!(component in componentPromiseMap)) {
    componentPromiseMap[component] = fetchComponent(component)
  } else if (componentPromiseResolvedMap[component]) {
    /* Loading was completed but the component was not registered.
     * This means something wrong happened */
    throw new Error(`Unable to fetch component ${component}`)
  }

  await componentPromiseMap[component]

  componentPromiseResolvedMap[component] = true

  return getImplementation(component)
}

interface Props {
  component: string | null
  props: any
  treePath: string
  runtime: RenderContext
  hydration: Hydration
}

const ComponentLoader: FunctionComponent<Props> = props => {
  const {
    component,
    children,
    treePath,
    props: componentProps,
    hydration,
  } = props

  if (component?.includes('Fold')) {
    return null
  }

  const Component = component && getImplementation(component)

  let content = Component ? (
    <Component {...componentProps}>{children}</Component>
  ) : (
    <AsyncComponent {...props}>{children}</AsyncComponent>
  )

  const shouldHydrate =
    !hydration ||
    hydration === 'always' ||
    /** TODO: Currently it only applies partial hydration on top level components
     * Nested partial hydration should be supported in the future */
    /** (using indexOf instead of regex for performance
     * https://jsperf.com/js-regex-match-vs-substring) */
    treePath?.substring(treePath?.indexOf('/') + 1).indexOf('/') > -1

  if (!shouldHydrate) {
    content = (
      <Hydration treePath={treePath} hydration={hydration}>
        {content}
      </Hydration>
    )
  }

  content = (
    <TreePathContextProvider treePath={treePath}>
      {content}
    </TreePathContextProvider>
  )

  if (isSiteEditorIframe) {
    content = <SiteEditorWrapper {...props}>{content}</SiteEditorWrapper>
  }

  return content
}

const AsyncComponent: FunctionComponent<Props> = props => {
  const {
    component,
    children,
    treePath,
    props: componentProps,
    runtime,
  } = props

  const isRootTreePath = treePath.indexOf('/') === -1
  const isAround = treePath.indexOf('$around') !== -1

  const [Component, setComponent] = useState(
    () => (component && getImplementation(component)) || null
  )

  useEffect(() => {
    // Does nothing if Component is loaded...
    // (or if component is nil)
    if (Component || !component) {
      return
    }

    // ...otherwise, fetches it and stores the result in the Component state
    fetchComponent(component, runtime.fetchComponent).then(result => {
      if (Component) {
        return
      }
      setComponent(() => result)
    })
  }, [Component, component, runtime.fetchComponent])

  return Component ? (
    <Component {...componentProps}>{children}</Component>
  ) : /** If the component is not loaded yet, renders a "loading"
   * state. This currently only applies to root components
   * (e.g. "store.home") */
  isRootTreePath || isAround ? (
    <>
      {componentProps.beforeElements}
      <GenericPreview />
      {componentProps.afterElements}
    </>
  ) : (
    <Loading />
  )
}

export default ComponentLoader

import React, {
  useEffect,
  useState,
  FunctionComponent,
  ReactNode,
  useMemo,
} from 'react'

import { getImplementation } from '../../utils/assets'
import GenericPreview from '../Preview/GenericPreview'
import Loading from '../Loading'
import { TreePathContextProvider } from '../../utils/treePath'
import { isSiteEditorIframe } from '../../utils/dom'
import SiteEditorWrapper from './SiteEditorWrapper'
import Hydration from '../Hydration'
import { LazyImages } from '../LazyImages'
import { generateSlot } from '../../utils/slots'

const componentPromiseMap: any = {}
const componentPromiseResolvedMap: any = {}

export async function fetchComponent(
  component: string,
  runtimeFetchComponent: RenderContext['fetchComponent'],
  retries = 3
): Promise<any> {
  const Component = component && getImplementation(component)

  if (Component) {
    return Component
  }

  if (!(component in componentPromiseMap)) {
    componentPromiseMap[component] = runtimeFetchComponent(component)
  } else if (componentPromiseResolvedMap[component]) {
    /** These retries perhaps are not needed anymore, but keeping just to be safe */
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000))
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

interface Props {
  component: string | null
  props: Record<string, any>
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

  /**
   * Slot props should ALWAYS be PascalCased.
   * It is OK to not include componentProps in the dependency array
   * since there is currently no way for users to ADD or UPDATE slots via CMS.
   * What this means is that the slots variable below only needs to be
   * computed once during runtime, since we know that, even if componentProps
   * is updated, the props that function as Slots will NOT change.
   */
  const slots = useMemo(() => {
    if (!componentProps) {
      return {}
    }

    const slotNames = Object.keys(componentProps).filter(
      key => key[0] !== key[0].toLowerCase()
    )
    const resultingSlotsProps: Record<string, ReactNode> = {}

    slotNames.forEach(
      slotName =>
        (resultingSlotsProps[slotName] = generateSlot({
          treePath,
          slotName,
          slotValue: componentProps[slotName],
          hydration,
        }))
    )

    return resultingSlotsProps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydration, treePath])

  const componentPropsWithSlots = useMemo(
    () => ({
      ...componentProps,
      ...slots,
    }),
    [componentProps, slots]
  )
  const asyncComponentProps = useMemo(
    () => ({
      ...props,
      props: componentPropsWithSlots,
    }),
    [componentPropsWithSlots, props]
  )

  const Component = useMemo(() => component && getImplementation(component), [
    component,
  ])

  if (component?.includes('Fold')) {
    return null
  }

  let content = Component ? (
    <Component {...componentPropsWithSlots}>{children}</Component>
  ) : (
    <AsyncComponent {...asyncComponentProps}>{children}</AsyncComponent>
  )

  const shouldHydrate =
    !hydration ||
    hydration === 'always' ||
    /** TODO: Currently it only applies partial hydration on top level components
     * Nested partial hydration should be supported in the future */
    /** (using indexOf instead of regex for performance
     * https://jsperf.com/js-regex-match-vs-substring) */
    treePath?.substring(treePath?.indexOf('/') + 1).indexOf('/') > -1

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

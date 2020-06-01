import React, { useEffect, useState, FunctionComponent, useMemo } from 'react'

import { getImplementation } from '../../utils/assets'
import GenericPreview from '../Preview/GenericPreview'
import Loading from '../Loading'
import { useSlots } from '../../utils/slots'

interface Props {
  component: string | null
  props: Record<string, any>
  treePath: string
  runtime: RenderContext
  hydration: Hydration
}

const componentPromiseMap: any = {}
const componentPromiseResolvedMap: any = {}

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
    fetchComponent(component, runtime.fetchComponent).then((result) => {
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

const ComponentGetter: FunctionComponent<Props> = (getterProps) => {
  const {
    component,
    props: componentProps = {},
    treePath,
    hydration,
    children,
  } = getterProps

  const slotProps = useSlots({
    props: componentProps,
    hydration,
    treePath,
  })

  const Component = getImplementation(component)

  const componentPropsWithSlots = useMemo(
    () => ({
      ...componentProps,
      ...slotProps,
    }),
    [componentProps, slotProps]
  )
  const asyncComponentProps = useMemo(
    () => ({
      ...getterProps,
      props: componentPropsWithSlots,
    }),
    [componentPropsWithSlots, getterProps]
  )

  if (Component) {
    return <Component {...componentPropsWithSlots}>{children}</Component>
  }

  return <AsyncComponent {...asyncComponentProps}>{children}</AsyncComponent>
}

export default ComponentGetter

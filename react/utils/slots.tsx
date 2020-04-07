import React, { FC, useState, useEffect } from 'react'

import { getImplementation } from './assets'
import { getChildExtensions } from '../components/ExtensionPoint'
import { useRuntime } from '../core/main'

interface GenerateSlotArgs {
  treePath: string
  slotName: string
  slotValue: string
  runtime: RenderContext
}

export function generateSlot({
  treePath,
  slotName,
  slotValue,
  runtime,
}: GenerateSlotArgs) {
  const newTreePath = `${treePath}/${slotValue}`
  let extension = runtime.extensions[newTreePath]

  const Component = getImplementation(extension?.component)
  let slotChildren = getChildExtensions(runtime, newTreePath)

  let componentProps = extension?.props ?? {}
  const capitalProps = Object.keys(componentProps).filter(
    (key) => key[0] !== key[0].toLowerCase()
  )

  if (capitalProps.length > 0) {
    const slots = capitalProps.map((slotName) => {
      return generateSlot({
        treePath: newTreePath,
        slotName,
        slotValue: componentProps[slotName],
        runtime,
      })
    })

    const resultingSlotsProps: Record<string, React.FC> = {}
    capitalProps.forEach((key, i) => (resultingSlotsProps[key] = slots[i]))

    componentProps = { ...componentProps, ...resultingSlotsProps }
  }

  const SlotComponent: FC<any> = (props) => {
    if (props.id) {
      const dynamicTreePath = newTreePath + '#' + props.id

      extension = runtime.extensions[dynamicTreePath] ?? extension
      slotChildren =
        getChildExtensions(runtime, dynamicTreePath) ?? slotChildren
      componentProps = extension?.props ?? {}

      const capitalProps = Object.keys(componentProps).filter(
        (key) => key[0] !== key[0].toLowerCase()
      )

      if (capitalProps.length > 0) {
        const slots = capitalProps.map((slotName) => {
          return generateSlot({
            treePath: dynamicTreePath,
            slotName,
            slotValue: componentProps[slotName],
            runtime,
          })
        })

        const resultingSlotsProps: Record<string, React.FC> = {}
        componentProps = { ...componentProps, ...resultingSlotsProps }

        capitalProps.forEach((key, i) => (resultingSlotsProps[key] = slots[i]))
      }
    }

    return Component ? (
      <Component {...props} {...componentProps}>
        {slotChildren}
      </Component>
    ) : (
      <AsyncSlot
        {...props}
        {...componentProps}
        component={extension?.component}
        treePath={newTreePath}
      >
        {slotChildren}
      </AsyncSlot>
    )
  }

  SlotComponent.displayName = `${slotName}Slot`

  return SlotComponent
}

/**
 * These next two lines and the fetchComponent function are duplicated
 * from ContextLoader.
 */
const componentPromiseMap: any = {}
const componentPromiseResolvedMap: any = {}

async function fetchComponent(
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

const AsyncSlot: FC<any> = (props) => {
  const runtime = useRuntime()
  const { component, treePath, children, ...componentProps } = props

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
  ) : null
}

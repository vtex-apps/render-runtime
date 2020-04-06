import React, { FC, useState, useEffect } from 'react'

import { getImplementation } from './assets'
import { getChildExtensions } from '../components/ExtensionPoint'
import { fetchComponent } from '../components/ExtensionPoint/ComponentLoader'
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
  const extension = runtime.extensions[newTreePath]

  const componentProps = extension?.props
  const Component = getImplementation(extension?.component)

  const slotChildren = getChildExtensions(runtime, newTreePath)

  const SlotComponent: FC = (props) =>
    Component ? (
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

  SlotComponent.displayName = `${slotName}Slot`

  return SlotComponent
}

const componentPromiseMap: any = {}
const componentPromiseResolvedMap: any = {}

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

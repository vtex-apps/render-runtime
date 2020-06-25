import React, { FC, useMemo } from 'react'

import { getChildExtensions } from '../components/ExtensionPoint'
import ComponentLoader from '../components/ExtensionPoint/ComponentLoader'
import { useRuntime } from '../core/main'

interface GenerateSlotArgs {
  treePath: string
  slotName: string
  slotValue: string
  hydration: Hydration
}

export function generateSlot({
  treePath,
  slotName,
  slotValue,
  hydration,
}: GenerateSlotArgs) {
  const newTreePath = `${treePath}/${slotValue}`

  const SlotComponent: FC<any> = (props) => {
    const runtime = useRuntime()
    const extension = runtime.extensions[newTreePath]

    const slotChildren = getChildExtensions(runtime, newTreePath)
    const componentProps = extension?.props ?? {}
    const extensionContent = extension?.content ?? {}

    const componentLoaderPropsWithContent = useMemo(
      () => ({
        // Props received by the slot being used directly as a component
        ...props,
        // Props received by the block referenced by slotValue in a user's theme
        ...componentProps,
        // Content saved in the CMS for this treePath
        ...extensionContent,
      }),
      [componentProps, extensionContent, props]
    )

    /**
     * The ComponentLoader component below will handle both recursive calls to generateSlots
     * (slots could contain slots another slots in its props) and partial hydration support.
     */
    return (
      <ComponentLoader
        component={extension?.component ?? null}
        props={componentLoaderPropsWithContent}
        treePath={newTreePath}
        runtime={runtime}
        hydration={hydration}
      >
        {slotChildren}
      </ComponentLoader>
    )
  }

  SlotComponent.displayName = `${slotName}Slot`

  return SlotComponent
}

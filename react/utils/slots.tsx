import React, { FC, useMemo, ReactNode } from 'react'

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

/**
 * Slot props should ALWAYS be PascalCased.
 * It is OK to not include componentProps in the dependency array
 * since there is currently no way for users to ADD or UPDATE slots via CMS.
 * What this means is that the slots variable below only needs to be
 * computed once during runtime, since we know that, even if componentProps
 * is updated, the props that function as Slots will NOT change.
 */
export function useSlots({ props, treePath, hydration }: any) {
  const slots = useMemo(() => {
    if (!props) {
      return {}
    }

    const slotNames = Object.keys(props).filter(
      (key) => key[0] !== key[0].toLowerCase()
    )
    const resultingSlotsProps: Record<string, ReactNode> = {}

    for (const slotName of slotNames) {
      resultingSlotsProps[slotName] = generateSlot({
        treePath,
        slotName,
        slotValue: props[slotName],
        hydration,
      })
    }

    return resultingSlotsProps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydration, treePath])

  return slots
}

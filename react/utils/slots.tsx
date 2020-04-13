import React, { FC } from 'react'
import { useQuery } from 'react-apollo'

import { getChildExtensions } from '../components/ExtensionPoint'
import ComponentLoader from '../components/ExtensionPoint/ComponentLoader'
import ListContent from '../queries/ListContent.graphql'

interface GenerateSlotArgs {
  treePath: string
  slotName: string
  slotValue: string
  runtime: RenderContext
  hydration: Hydration
}

export function generateSlot({
  treePath,
  slotName,
  slotValue,
  runtime,
  hydration,
}: GenerateSlotArgs) {
  const newTreePath = `${treePath}/${slotValue}`
  let extension = runtime.extensions[newTreePath]

  let slotChildren = getChildExtensions(runtime, newTreePath)

  let componentProps = extension?.props ?? {}

  const SlotComponent: FC<any> = props => {
    if (props.id) {
      const hasLabel = slotValue.includes('#')
      const dynamicTreePath = `${newTreePath}${hasLabel ? '-' : '#'}${props.id}`

      if (!runtime.extensions[dynamicTreePath]) {
        slotChildren =
          getChildExtensions(runtime, dynamicTreePath) ?? slotChildren
        componentProps = extension?.props ?? {}
        const baseSlotBlockId = extension?.blockId

        return (
          <DynamicSlot
            treePath={dynamicTreePath}
            runtime={runtime}
            hydration={hydration}
            component={extension?.component ?? null}
            props={{ ...props, ...componentProps }}
            blockId={baseSlotBlockId}
            baseTreePath={newTreePath}
          >
            {slotChildren}
          </DynamicSlot>
        )
      }

      extension = runtime.extensions[dynamicTreePath]
      slotChildren =
        getChildExtensions(runtime, dynamicTreePath) ?? slotChildren
      componentProps = extension?.props ?? {}
    }

    const extensionContent = extension?.content

    return (
      <ComponentLoader
        component={extension?.component ?? null}
        props={{ ...props, ...componentProps, ...extensionContent }}
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

interface DynamicSlotProps {
  component: any
  props: any
  blockId: string | undefined
  treePath: string
  runtime: RenderContext
  hydration: Hydration
  baseTreePath: string
}

const DynamicSlot: FC<DynamicSlotProps> = ({
  treePath,
  runtime,
  hydration,
  component,
  props,
  children,
  blockId,
  baseTreePath,
}) => {
  const { data, loading, error } = useQuery(ListContent, {
    variables: {
      bindingId: runtime.binding?.id,
      template: runtime.page,
      blockId,
      treePath: treePath.replace(runtime.page, '*'),
      pageContext: runtime.route.pageContext,
    },
  })

  if (loading) {
    return null
  }
  if (error) {
    console.error(error)
    return null
  }

  const extensionContent =
    (data.listContent[1]?.contentJSON &&
      JSON.parse(data.listContent[1]?.contentJSON)) ??
    (data.listContent[0]?.contentJSON &&
      JSON.parse(data.listContent[0]?.contentJSON))

  if (!extensionContent) {
    runtime.extensions[treePath] = runtime.extensions[baseTreePath]
  } else {
    runtime.extensions[treePath] = {
      ...runtime.extensions[baseTreePath]!,
      content: extensionContent,
    }
  }

  return (
    <ComponentLoader
      component={component ?? null}
      props={{ ...props, ...extensionContent }}
      treePath={treePath}
      runtime={runtime}
      hydration={hydration}
    >
      {children}
    </ComponentLoader>
  )
}

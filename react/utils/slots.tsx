import React, { FC, memo } from 'react'
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

interface DynamicSlotProps {
  component: string | null
  props: Record<string, any>
  blockId: string | undefined
  treePath: string
  runtime: RenderContext
  hydration: Hydration
  baseTreePath: string
}

interface ListContentQuery {
  listContent: Array<{ contentJSON: string }>
}

export function generateSlot({
  treePath,
  slotName,
  slotValue,
  runtime,
  hydration,
}: GenerateSlotArgs) {
  const hasSlotMarker = treePath.indexOf('slot') > -1
  const treePathWithoutSlotMarker = hasSlotMarker
    ? treePath.substring(0, treePath.indexOf('-slot'))
    : treePath
  const newTreePath = `${treePathWithoutSlotMarker}/${slotValue}`
  let extension = runtime.extensions[newTreePath]

  let slotChildren = getChildExtensions(runtime, newTreePath)

  let componentProps = extension?.props ?? {}

  const SlotComponent: FC<any> = memo(props => {
    if (props.id) {
      const hasLabel = slotValue.includes('#')
      const dynamicTreePath = `${newTreePath}${hasLabel ? '-' : '#'}slot${
        props.id
      }`

      slotChildren =
        getChildExtensions(runtime, dynamicTreePath) ?? slotChildren

      if (!runtime.extensions[dynamicTreePath]) {
        componentProps = extension?.props ?? {}
        const baseSlotBlockId = extension?.blockId
        const dynamicSlotProps = { ...props, ...componentProps }

        return (
          <DynamicSlot
            treePath={dynamicTreePath}
            runtime={runtime}
            hydration={hydration}
            component={extension?.component ?? null}
            props={dynamicSlotProps}
            blockId={baseSlotBlockId}
            baseTreePath={newTreePath}
          >
            {slotChildren}
          </DynamicSlot>
        )
      }

      extension = runtime.extensions[dynamicTreePath]
      componentProps = extension?.props ?? {}
    }

    const extensionContent = extension?.content
    const componentLoaderPropsWithContent = {
      ...props,
      ...componentProps,
      ...extensionContent,
    }

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
  })

  SlotComponent.displayName = `${slotName}Slot`

  return SlotComponent
}

const DynamicSlot: FC<DynamicSlotProps> = memo(
  ({
    treePath,
    runtime,
    hydration,
    component,
    props,
    children,
    blockId,
    baseTreePath,
  }) => {
    const { data, loading, error } = useQuery<ListContentQuery>(ListContent, {
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

    let extensionContent =
      (data?.listContent[1]?.contentJSON &&
        (JSON.parse(data.listContent[1]?.contentJSON) as Record<
          string,
          any
        >)) ??
      (data?.listContent[0]?.contentJSON &&
        (JSON.parse(data.listContent[0]?.contentJSON) as Record<string, any>))

    if (!extensionContent) {
      runtime.extensions[treePath] = runtime.extensions[baseTreePath]
      extensionContent = runtime.extensions[baseTreePath]?.content
    } else {
      runtime.extensions[treePath] = runtime.extensions[baseTreePath]
        ? {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            ...runtime.extensions[baseTreePath]!,
            content: extensionContent,
          }
        : null
    }

    const componentLoaderPropsWithContent = extensionContent
      ? { ...props, ...extensionContent }
      : props

    return (
      <ComponentLoader
        component={component ?? null}
        props={componentLoaderPropsWithContent}
        treePath={treePath}
        runtime={runtime}
        hydration={hydration}
      >
        {children}
      </ComponentLoader>
    )
  }
)

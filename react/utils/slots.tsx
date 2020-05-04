import React, { FC, memo, useMemo } from 'react'
import { useQuery } from 'react-apollo'

import { getChildExtensions } from '../components/ExtensionPoint'
import ComponentLoader from '../components/ExtensionPoint/ComponentLoader'
import ListContent from '../queries/ListContent.graphql'
import { useRuntime } from '../core/main'

interface GenerateSlotArgs {
  treePath: string
  slotName: string
  slotValue: string
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
  hydration,
}: GenerateSlotArgs) {
  const slotMarkerRegex = /(-|#)slot/
  const slotMarkerInTreePath = treePath.match(slotMarkerRegex)
  const treePathWithoutSlotMarker = slotMarkerInTreePath
    ? treePath.substring(0, treePath.indexOf(slotMarkerInTreePath[0]))
    : treePath

  const newTreePath = `${treePathWithoutSlotMarker}/${slotValue}`

  const SlotComponent: FC<any> = memo(props => {
    const runtime = useRuntime()
    let extension = runtime.extensions[newTreePath]

    const slotChildren = getChildExtensions(runtime, newTreePath)
    let componentProps = extension?.props ?? {}

    if (props.id) {
      const hasLabel = slotValue.includes('#')
      const dynamicTreePath = `${newTreePath}${hasLabel ? '-' : '#'}slot${
        props.id
      }`

      if (!(dynamicTreePath in runtime.extensions)) {
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
  const { data, loading, error } = useQuery<ListContentQuery>(ListContent, {
    variables: {
      bindingId: runtime.binding?.id,
      template: runtime.page,
      blockId,
      treePath: treePath.replace(runtime.page, '*'),
      pageContext: runtime.route.pageContext,
    },
  })

  const contentFromCMS =
    data?.listContent[1]?.contentJSON &&
    (JSON.parse(data.listContent[1]?.contentJSON) as Record<string, any>)
  /**
   * This default content for a certain blockId is often just the same values
   * passed by users in their themes.
   */
  const defaultContentForBlockId =
    data?.listContent[0]?.contentJSON &&
    (JSON.parse(data.listContent[0]?.contentJSON) as Record<string, any>)

  let extensionContentFromCMS = contentFromCMS ?? defaultContentForBlockId

  const componentLoaderPropsWithContent = useMemo(
    () =>
      extensionContentFromCMS
        ? { ...props, ...extensionContentFromCMS }
        : props,
    [extensionContentFromCMS, props]
  )

  if (loading) {
    return null
  }
  if (error) {
    console.error(error)
    return null
  }

  if (!extensionContentFromCMS) {
    runtime.extensions[treePath] = runtime.extensions[baseTreePath]
    extensionContentFromCMS = runtime.extensions[baseTreePath]?.content
  } else {
    runtime.extensions[treePath] = runtime.extensions[baseTreePath]
      ? {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          ...runtime.extensions[baseTreePath]!,
          content: extensionContentFromCMS,
        }
      : null
  }

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

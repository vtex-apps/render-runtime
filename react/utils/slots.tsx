import React, { FC } from 'react'

import { getImplementation } from './assets'
import { getChildExtensions } from '../components/ExtensionPoint'

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
  // const isEditable = isComponentEditable()

  // if (isEditable) {
  //   SlotComponent = (props) => {
  //     useEffect(() => {
  //       addDataToElement(newTreePath),
  //     }, [])

  //     return <Component {...extension.props} {...props} />
  //   }
  // } else {
  //   SlotComponent = (props) => <Component {...extension.props} {...props} />
  // }

  const slotChildren = getChildExtensions(runtime, newTreePath)

  const SlotComponent: FC = props =>
    Component ? (
      <Component {...props} {...componentProps}>
        {slotChildren}
      </Component>
    ) : null

  SlotComponent.displayName = `${slotName}Slot`

  return SlotComponent
}

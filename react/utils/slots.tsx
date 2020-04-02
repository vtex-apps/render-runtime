import React, { FC } from 'react'

import { getImplementation } from './assets'

interface GenerateSlotArgs {
  treePath: string
  slotName: string
  slotValue: string
  runtimeExtensions: Extensions
}

export function generateSlot({
  treePath,
  slotName,
  slotValue,
  runtimeExtensions,
}: GenerateSlotArgs) {
  const newTreePath = `${treePath}/${slotValue}`
  const extension = runtimeExtensions[newTreePath]

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

  const SlotComponent: FC = props =>
    Component ? <Component {...props} {...componentProps} /> : null

  SlotComponent.displayName = `${slotName}Slot`

  return SlotComponent
}

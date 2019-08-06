import React, { FunctionComponent, useContext, useMemo } from 'react'
import { useTreePath } from '../utils/treePath'
import { useRuntime } from './RenderContext'

interface OwnerBlockValue {
  identifier: string
  name: string
  vendor: string
  version: string
  props: Record<string, any>
}

type EmptyOwnerBlockValue = Record<keyof OwnerBlockValue, undefined>

const initialValue: EmptyOwnerBlockValue = {
  identifier: undefined,
  name: undefined,
  vendor: undefined,
  version: undefined,
  props: undefined,
}

const OwnerBlockContext = React.createContext<
  OwnerBlockValue | EmptyOwnerBlockValue
>({
  ...initialValue,
})

/**
 * This is adds a context of which block the current tree is owned by.
 */
export const OwnerBlockProvider: FunctionComponent = props => {
  const runtime = useRuntime()
  const { treePath } = useTreePath()

  const extension = runtime.extensions[treePath]
  const blockProps = extension && extension.props
  const blockId = extension && extension.blockId

  const value = useMemo(() => {
    if (!blockId) {
      return { ...initialValue }
    }

    const vendor = blockId.slice(0, blockId.indexOf('.'))
    const name = blockId.slice(blockId.indexOf('.') + 1, blockId.indexOf('@'))
    const version = blockId.slice(
      blockId.indexOf('@') + 1,
      blockId.indexOf(':')
    )

    return {
      identifier: `${vendor}.${name}@${version}`,
      name,
      vendor,
      version,
      props: blockProps,
    }
  }, [blockId, blockProps])

  return <OwnerBlockContext.Provider value={value} {...props} />
}

export const useOwnerBlock = () => {
  const context = useContext(OwnerBlockContext)

  if (!context) {
    throw new Error('useOwnerBlock must be used within a OwnerBlockProvider')
  }

  return context
}

import React, { FunctionComponent, useContext, useMemo } from 'react'
import { useTreePath } from '../utils/treePath'
import { useRuntime } from './RenderContext'

interface OwnerExtensionValue {
  identifier: string
  name: string
  vendor: string
  version: string
}

const OwnerExtensionContext = React.createContext<OwnerExtensionValue | undefined>(undefined)

export const OwnerExtensionProvider: FunctionComponent = (props) => {
  const runtime = useRuntime()
  const { treePath } = useTreePath()

  const extension = runtime.extensions[treePath]

  if (!extension || !extension.blockId) {
    return (
      <OwnerExtensionContext.Provider value={undefined} />
    )
  }

  const { blockId } = extension

  const value = useMemo(() => {
    const vendor = blockId.slice(0, blockId.indexOf('.'))
    const name = blockId.slice(blockId.indexOf('.') + 1, blockId.indexOf('@'))
    const version = blockId.slice(blockId.indexOf('@') + 1, blockId.indexOf(':'))

    return {
      identifier: `${vendor}.${name}@${version}`,
      name,
      vendor,
      version,
    }
  }, [blockId])

  return (
    <OwnerExtensionContext.Provider value={value} {...props} />
  )
}

export const useOwnerExtension = () => {
  const context = useContext(OwnerExtensionContext)

  if (!context) {
    throw new Error('useOwnerExtension must be used within a OwnerExtensionProvider')
  }

  return context
}


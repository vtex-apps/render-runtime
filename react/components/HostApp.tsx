import React, { FunctionComponent, useContext, useMemo } from 'react'
import { useTreePath } from '../utils/treePath'
import { useRuntime } from './RenderContext'

interface HostAppValue {
  identifier: string
  name: string
  vendor: string
  version: string
}

const HostAppContext = React.createContext<HostAppValue | undefined>(undefined)

export const HostAppProvider: FunctionComponent = (props) => {
  const runtime = useRuntime()
  const { treePath } = useTreePath()

  const extension = runtime.extensions[treePath]

  if (!extension || !extension.blockId) {
    return (
      <HostAppContext.Provider value={undefined} />
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
    <HostAppContext.Provider value={value} {...props} />
  )
}

export const useHostApp = () => {
  const context = useContext(HostAppContext)

  if (!context) {
    throw new Error('useHostApp must be used within a HostAppProvider')
  }

  return context
}


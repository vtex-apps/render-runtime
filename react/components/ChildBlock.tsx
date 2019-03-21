import React from 'react'
import { useRuntime } from './RenderContext'
import { useTreePath } from '../utils/treePath'

export function useChildBlock({ id }: ChildBlock) : Block | null {
  const runtime = useRuntime()
  const { treePath } = useTreePath()

  const childPath = mountTreePath(id, treePath)
  const block = runtime.extensions && runtime.extensions[childPath]

  // We are explicitly not exposing the private API here
  /** Placeholder for possible block data in the future  */
  return block ? {} : null
}

export function ChildBlock({ id, children }: ChildBlockProps) {
  const block = useChildBlock({ id })

  return children(block)
}

interface ChildBlock {
  id: string
}

/** Placeholder for possible block data in the future */
/* tslint:disable-next-line no-empty-interface */
interface Block {
}

interface ChildBlockProps extends ChildBlock {
  children(block: Block | null): React.ReactNode
}

function mountTreePath(currentId: string, parentTreePath: string) {
  return [parentTreePath, currentId].filter(id => !!id).join('/')
}

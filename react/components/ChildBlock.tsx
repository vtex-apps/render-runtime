import React from 'react'
import { useTreePath } from '../utils/treePath'
import { useRuntime } from './RenderContext'

export function useChildBlock(childBlock: ChildBlock) : Block | null {
  if (typeof childBlock === 'string') {
    throw new Error(`You are passing a string as a parameter to useChildBlock ("${childBlock}"). You should pass an object like {id: "${childBlock}"}.`)
  }

  const { id } = childBlock

  if (!id) {
    throw new Error('The id you are sending to useChildBlock is empty')
  }

  const runtime = useRuntime()
  const { treePath } = useTreePath()

  const childPath = mountTreePath(id, treePath)
  const block = runtime.extensions && runtime.extensions[childPath]

  // We are explicitly not exposing the private API here
  return block
    ? {
      props: block.props,
    }
    : null
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

import React from 'react'
import { useExtension } from '../hooks/extension'

export function useChildBlock(childBlock: ChildBlock): Block | null {
  if (typeof childBlock === 'string') {
    throw new Error(
      `You are passing a string as a parameter to useChildBlock ("${childBlock}"). You should pass an object like {id: "${childBlock}"}.`
    )
  }

  const { id } = childBlock

  if (!id) {
    throw new Error('The id you are sending to useChildBlock is empty')
  }

  const extension = useExtension({ children: id })

  // We are explicitly not exposing the private API here
  return extension
    ? {
        props: extension.props,
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
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Block {}

interface ChildBlockProps extends ChildBlock {
  children(block: Block | null): React.ReactNode
}

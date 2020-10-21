import React from 'react'
import { Block, ChildBlockType, useChildBlock } from './useChildBlock'

interface ChildBlockProps extends ChildBlockType {
  children(block: Block | null): React.ReactNode
}

export function ChildBlock({ id, children }: ChildBlockProps) {
  const block = useChildBlock({ id })

  return children(block)
}

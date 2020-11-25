import React from 'react'
import useChildBlock, { Block, ChildBlockType } from './useChildBlock'

interface ChildBlockProps extends ChildBlockType {
  children(block: Block | null): React.ReactNode
}

function ChildBlock({ id, children }: ChildBlockProps) {
  const block = useChildBlock({ id })

  return children(block)
}

export default ChildBlock

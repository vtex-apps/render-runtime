import React from 'react'

import { useExtension } from '../utils/extension'

import Preview from './Preview'

const Loading = () => {
  const extension = useExtension()

  if (!extension) {
    return null
  }

  const { preview } = extension

  if (!preview) {
    return null
  }

  return (
    <Preview extension={extension} />
  )
}

export default Loading

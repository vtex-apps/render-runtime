import React from 'react'

import Preview from './Preview'

import { useExtension } from '../hooks/extension'

const Loading = () => {
  const extension = useExtension()

  if (!extension) {
    return null
  }

  const { preview } = extension

  if (!preview) {
    return null
  }

  return <Preview extension={extension} />
}

export default Loading

import React from 'react'

import Preview from './Preview'

const Loading = ({extension}: {extension?: Extension}) => {
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

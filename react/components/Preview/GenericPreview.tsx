import React from 'react'
import Box from './Box'

const GenericPreview = () => {
  const padding = 90
  const width = (window && window.innerWidth) || 0
  const height = (window && window.innerHeight) || 0

  return (
    <div className={'center w-100'} style={{ padding }}>
      <Box height={height} width={width - padding * 2} />
    </div>
  )
}

export default GenericPreview

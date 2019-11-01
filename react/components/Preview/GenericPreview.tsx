import React from 'react'
import Box from './Box'

const GenericPreview = () => {
  const padding = 20
  const height = (window && window.innerHeight) || 1400

  return (
    <div className="center w-100 mw9" style={{ padding }}>
      <Box height={height} width="100%" />
    </div>
  )
}

export default GenericPreview

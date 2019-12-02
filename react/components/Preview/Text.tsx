import React from 'react'
import { ContentLoader, Rect } from './ContentLoader'
import Box from './Box'

interface Props {
  width: number | string
  height: number | string
  lineHeight?: number
  fontSize?: number
}

const Text = ({ width, height, fontSize = 16, lineHeight = 1.5 }: Props) => {
  // Height needs to be a value in pixels in order to be able to split it properly into lines.
  // Falls back to `Box` if it's e.g. `100%`
  if (typeof height === 'string') {
    return <Box width={width} height={height} />
  }

  // TODO: make the line height configurable
  const lineSize = fontSize * lineHeight
  const lines = Math.round(height / lineSize)

  return (
    <ContentLoader width={width} height={height}>
      {Array.from({ length: lines }).map((_, i) => {
        const lineWidth = width
        return (
          <Rect
            key={i}
            x={0}
            y={Math.round(i * lineSize)}
            width={lineWidth}
            height={fontSize}
          />
        )
      })}
    </ContentLoader>
  )
}

export default Text

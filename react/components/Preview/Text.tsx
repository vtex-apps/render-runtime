import React from 'react'
import { ContentLoader, Rect } from './ContentLoader'
import Box from './Box'
import { useSSR } from '../NoSSR'

interface Props {
  width: number | string
  height: number | string
}

const Text = ({ width, height }: Props) => {
  const isSSR = useSSR()

  if (isSSR || typeof width === 'string' || typeof height === 'string') {
    return <Box width={width} height={height} />
  }

  // TODO: make the line height configurable
  const lineHeight = 16
  const lineSize = lineHeight * 1.5
  const lines = Math.round(height / lineSize)
  const lineSpacing = height / lines - lineHeight
  const actualLineSize = lineHeight + lineSpacing
  const horizontalMargin = 16

  return (
    <ContentLoader width={width} height={height}>
      {Array.from({ length: lines }).map((_, i) => {
        const isLast = i === lines - 1
        const widthMultiplier = isLast ? 0.7 : 1
        const lineWidth = width * widthMultiplier - horizontalMargin * 2
        return (
          <Rect
            key={i}
            x={horizontalMargin}
            y={Math.round(i * actualLineSize)}
            width={lineWidth}
            height={lineHeight}
          />
        )
      })}
    </ContentLoader>
  )
}

export default Text

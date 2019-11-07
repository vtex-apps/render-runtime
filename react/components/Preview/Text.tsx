import React from 'react'
import { ContentLoader, Rect } from './ContentLoader'
import Box from './Box'
import { useSSR } from '../NoSSR'

interface Props {
  width: number | string
  height: number | string
  lineHeight?: number
  fontSize?: number
  paragraph?: boolean
}

const Text = ({
  width,
  height,
  fontSize = 16,
  lineHeight = 1.5,
  paragraph = true,
}: Props) => {
  const isSSR = useSSR()

  if (isSSR || typeof width === 'string' || typeof height === 'string') {
    return <Box width={width} height={height} />
  }

  // TODO: make the line height configurable
  const lineSize = fontSize * lineHeight
  const lines = Math.round(height / lineSize)

  return (
    <ContentLoader width={width} height={height}>
      {Array.from({ length: lines }).map((_, i) => {
        const isLast = i === lines - 1
        const widthMultiplier = isLast && paragraph ? 0.7 : 1
        const lineWidth = width * widthMultiplier
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

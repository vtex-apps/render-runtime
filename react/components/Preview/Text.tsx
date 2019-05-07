import React from 'react'
import ContentLoader from './ContentLoader'

interface Props {
  width: number
  height: number
}

const Text = ({width, height}: Props) => {
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
        const lineWidth =
          width * widthMultiplier - horizontalMargin * 2
        return (
          <rect
            key={i}
            x={horizontalMargin}
            y={Math.round(i * actualLineSize)}
            rx="5"
            ry="5"
            width={lineWidth}
            height={lineHeight}
          />
        )
      })}
    </ContentLoader>
  )
}

export default Text

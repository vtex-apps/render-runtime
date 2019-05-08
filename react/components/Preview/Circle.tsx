import React from 'react'
import ContentLoader from './ContentLoader'

interface Props {
  width: number
  height: number
}

const Circle = ({width, height}: Props) => (
  <ContentLoader width={width} height={height} preserveAspectRatio="xMidYMid meet">
    <rect
      x="0"
      y="0"
      rx={width}
      ry={height}
      width={width}
      height={height}
    />
  </ContentLoader>
)

export default Circle

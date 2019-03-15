import React from 'react'

interface Props {
  width: number
  height: number
}

const Circle = ({width, height}: Props) => (
  <rect
    x="0"
    y="0"
    rx={width}
    ry={height}
    width={width}
    height={height}
  />
)

export default Circle

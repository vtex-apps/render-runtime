import React from 'react'

interface Props {
  width: number
  height: number
}

const Box = ({width, height}: Props) => (
  <rect
    x="0"
    y="0"
    rx="5"
    ry="5"
    width={width}
    height={height}
  />
)

export default Box

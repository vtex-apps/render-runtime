import React from 'react'
import ContentLoader from './ContentLoader'

interface Props {
  width: number
  height: number
}

const Box = ({ width, height }: Props) => (
  <ContentLoader width={width} height={height}>
    <rect x="0" y="0" rx="5" ry="5" width={width} height={height} />
  </ContentLoader>
)

export default Box

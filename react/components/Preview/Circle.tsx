import React from 'react'
import { ContentLoader, Rect } from './ContentLoader'

interface Props {
  width: number | string
  height: number | string
}

const Circle = ({ width, height }: Props) => (
  <ContentLoader width={width} height={height}>
    <Rect width={width} height={height} borderRadius="100%" />
  </ContentLoader>
)

export default Circle

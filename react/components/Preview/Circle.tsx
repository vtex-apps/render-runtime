import React from 'react'
import { ContentLoader, Box } from './ContentLoader2'

interface Props {
  width: number
  height: number
}

const Circle = ({ width, height }: Props) => (
  <ContentLoader width={width} height={height}>
    <Box width={width} height={height} borderRadius="100%" />
  </ContentLoader>
)

export default Circle

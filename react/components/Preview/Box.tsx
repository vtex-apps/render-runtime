import React from 'react'
import { ContentLoader, Rect } from './ContentLoader2'

interface Props {
  width: number
  height: number
}

const Box = ({ width, height }: Props) => (
  <ContentLoader width={width} height={height}>
    <Rect x={0} y={0} width={width} height={height} />
  </ContentLoader>
)

export default Box

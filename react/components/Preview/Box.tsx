import React from 'react'
import { ContentLoader, Rect } from './ContentLoader'

interface Props {
  width: number | string
  height: number | string
}

const Box = ({ width, height }: Props) => (
  <ContentLoader width={width} height={height}>
    <Rect x={0} y={0} width={width} height={height} />
  </ContentLoader>
)

export default Box

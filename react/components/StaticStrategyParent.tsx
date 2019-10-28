import React, { FC, Fragment } from 'react'
import RenderClientOnly from './RenderClientOnly'
import RenderOnInteraction from './RenderOnInteraction'

const StaticStrategyParent: FC<{ staticStrategy: StaticStrategy }> = ({
  staticStrategy,
  children,
}) => {
  if (staticStrategy === 'always') {
    return <RenderClientOnly>{children}</RenderClientOnly>
  }

  if (staticStrategy === 'on-interaction') {
    return <RenderOnInteraction>{children}</RenderOnInteraction>
  }

  return <Fragment>{children}</Fragment>
}

export default StaticStrategyParent

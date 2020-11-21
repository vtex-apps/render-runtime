import React, { FunctionComponent } from 'react'
import LazyRender from './LazyRender'

interface Props {
  foldIndex?: number
}
const FoldableContainer: FunctionComponent<Props> = ({
  children,
  foldIndex,
}) => {
  if (foldIndex == null || foldIndex === -1) {
    return <>{children}</>
  }
  const childrenArray = React.Children.toArray(children)
  const aboveTheFold = childrenArray.slice(0, foldIndex)
  const belowTheFold = childrenArray.slice(foldIndex).map((element, i) => {
    return <LazyRender key={i}>{element}</LazyRender>
  })

  return (
    <>
      {aboveTheFold}
      {belowTheFold}
    </>
  )
}

export default FoldableContainer

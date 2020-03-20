import React, { FunctionComponent } from 'react'
import HydrateOnView from './HydrateOnView'

interface Props {
  treePath: string
  hydration: Hydration
}

const Hydration: FunctionComponent<Props> = ({
  hydration,
  treePath,
  children,
}) => {
  if (hydration === 'on-view') {
    return <HydrateOnView treePath={treePath}>{children}</HydrateOnView>
  }

  return <>{children}</>
}

export default Hydration

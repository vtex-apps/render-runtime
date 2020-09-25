import React, { FunctionComponent } from 'react'
import HydrateOnView from './HydrateOnView'
import { Extension } from '../../typings/runtime'

interface Props {
  treePath: string
  hydration: Extension['hydration']
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

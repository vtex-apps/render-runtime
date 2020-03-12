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
  if (
    !hydration ||
    hydration === 'always' ||
    /** TODO: Currently it only applies partial hydration on top level components
     * Deeper level partial hydration should be supported in the future */
    (treePath?.match?.(/\//g) ?? []).length > 1
  ) {
    return <>{children}</>
  }

  if (hydration === 'on-view') {
    return <HydrateOnView treePath={treePath}>{children}</HydrateOnView>
  }

  return <>{children}</>
}

export default Hydration

import React, { ReactPortal, FC, useState, useEffect, Fragment } from 'react'

import { createPortal } from '../../utils/dom'
import { getDirectChildren, useTreePath } from '../../utils/treePath'
import ExtensionPoint from '.'
import { useRuntime } from '../RenderContext'

interface Props {
  query: any
  params: any
}

const LegacyExtensionContainer: FC<Props> = ({ query, params }) => {
  const [hydrate, setHydrate] = useState(false)
  useEffect(() => {
    setHydrate(true)
  }, [])
  const { extensions } = useRuntime()
  const { treePath } = useTreePath()
  return (
    <Fragment>
      {getDirectChildren(extensions, treePath).map(
        (id) =>
          createPortal(
            <ExtensionPoint id={id} query={query} params={params} />,
            `${treePath}/${id}`,
            hydrate
          ) as ReactPortal
      )}
    </Fragment>
  )
}

export default LegacyExtensionContainer

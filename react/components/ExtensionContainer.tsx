import React, { FC, Fragment } from 'react'

import { getDirectChildren, useTreePath } from '../utils/treePath'
import ExtensionPoint from './ExtensionPoint'
import { useRuntime } from './RenderContext'

const join = (p: string | null, c: string | null): string =>
  [p, c].filter(id => !!id).join('/')

interface Props {
  id: string | null
}

const ExtensionContainer: FC<Props> = props => {
  const { id } = props
  const { extensions } = useRuntime()
  const { treePath } = useTreePath()
  const containerTreePath = join(treePath, id)
  return (
    <Fragment>
      {getDirectChildren(extensions, containerTreePath).map(cid => {
        const childTreePath = join(id, cid)
        return (
          <ExtensionPoint {...props} key={childTreePath} id={childTreePath} />
        )
      })}
    </Fragment>
  )
}

export default ExtensionContainer

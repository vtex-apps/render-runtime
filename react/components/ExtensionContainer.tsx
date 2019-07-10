import React, { FC } from 'react'

import { getDirectChildren, useTreePath } from '../utils/treePath'
import ExtensionPoint from './ExtensionPoint'
import { useRuntime } from './RenderContext'

const join = (p: string | null, c: string | null): string =>
  [p, c].filter(id => !!id).join('/')

interface Props {
  id: string | null
}

const ExtensionContainer: FC<Props> = props => {
  const runtime = useRuntime()
  const { treePath } = useTreePath()
  const containerTreePath = join(treePath, props.id)

  return (
    <>
      {getDirectChildren(runtime.extensions, containerTreePath).map(cid => {
        const childTreePath = join(props.id, cid)
        return (
          <ExtensionPoint {...props} key={childTreePath} id={childTreePath} />
        )
      })}
    </>
  )
}

export default ExtensionContainer

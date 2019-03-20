import React, { Component, CSSProperties } from 'react'

import { TreePathContext, TreePathProps } from '../utils/treePath'

import Preview, {Props as PreviewProps} from './Preview'
import { RenderContextProps, withRuntimeContext } from './RenderContext'

interface Props {
  preview?: PreviewProps
}

class Loading extends Component<RenderContextProps & Props> {
  public render() {
    const { runtime: { extensions } } = this.props

    return (
      <TreePathContext.Consumer>
        {(value: TreePathProps) => {
          const t = value.treePath
          const extension = t && extensions[t]
          const preview = (extension && extension.preview) || this.props.preview

          return preview && <Preview {...preview} />
        }}
      </TreePathContext.Consumer>
    )
  }
}

export default withRuntimeContext<Props>(Loading)

import React, { Component, CSSProperties } from 'react'

import { TreePathContext, TreePathProps } from '../utils/treePath'

import Preview, {Props as PreviewProps} from './Preview'
import { RenderContextProps, withRuntimeContext } from './RenderContext'

interface Props {
  preview?: PreviewProps
}

class Loading extends Component<RenderContextProps & Props> {
  public render() { // tslint:disable-line member-ordering
    const { runtime: { extensions } } = this.props

    return (
      <TreePathContext.Consumer>
        {(value: TreePathProps) => {
          const t = value.treePath

          const preview = (t && extensions[t] && extensions[t].preview) || this.props.preview

          return preview && <Preview {...preview} />
        }}
      </TreePathContext.Consumer>
    )
  }
}

export default withRuntimeContext<Props>(Loading)

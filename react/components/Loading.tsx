import React, { Component, CSSProperties } from 'react'

import { TreePathContext, TreePathProps } from '../utils/treePath'

import Preview, {Props as PreviewProps} from './Preview'
import { RenderContextProps, withRuntimeContext } from './RenderContext'

interface Props {
  preview?: PreviewProps
}

interface State {
  visible?: boolean
}

const LOADING_TRESHOLD_MS = 1000
// If a Loading component unmounts and remounts within this time, it should be visible from the start.
const LOADING_UNMOUNT_TRESHOLD_MS = 1000

class Loading extends Component<RenderContextProps & Props, State> {
  public state: State = {
    visible: false,
  }
  private thresholdTimeout?: number

  public componentDidMount() {
    if (!this.state.visible) {
      this.thresholdTimeout = window.setTimeout(() => {
        this.setState({ visible: true })
      }, LOADING_TRESHOLD_MS)
    }
  }

  public componentWillUnmount() {
    if (this.thresholdTimeout) {
      clearTimeout(this.thresholdTimeout)
    }

    window.setTimeout(() => {
      this.setState({ visible: false })
    }, LOADING_UNMOUNT_TRESHOLD_MS)
  }

  public render() { // tslint:disable-line member-ordering
    const { runtime: { extensions } } = this.props
    const { visible: isVisible } = this.state
    const style: CSSProperties = { visibility: 'hidden' }

    return (
      <TreePathContext.Consumer>
        {(value: TreePathProps) => {
          const t = value.treePath

          const preview = (t && extensions[t] && extensions[t].preview) || this.props.preview

          const loadingComponent = preview && <Preview {...preview} />

          return (
            <div style={isVisible ? undefined : style}>
              {loadingComponent}
            </div>
          )
        }}
      </TreePathContext.Consumer>
    )
  }
}

export default withRuntimeContext<Props>(Loading)

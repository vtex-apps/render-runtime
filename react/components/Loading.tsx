import React, {CSSProperties, PureComponent} from 'react'
import {Instagram, List} from 'react-content-loader'

import { TreePathContext, TreePathProps } from '../utils/treePath'

import {RenderContextProps, withRuntimeContext} from './RenderContext'

interface State {
  visible?: boolean
}

const LOADING_TRESHOLD_MS = 1000
// If a Loading component unmounts and remounts within this time, it should be visible from the start.
const LOADING_UNMOUNT_TRESHOLD_MS = 1000
let visible = false

class Loading extends PureComponent<RenderContextProps, State> {
  public state: State = {
    visible,
  }
  private thresholdTimeout?: number

  public componentDidMount() {
    if (!this.state.visible) {
      this.thresholdTimeout = window.setTimeout(() => {
        visible = true
        this.setState({visible: true})
      }, LOADING_TRESHOLD_MS)
    }
  }

  public componentWillUnmount() {
    if (this.thresholdTimeout) {
      clearTimeout(this.thresholdTimeout)
    }

    window.setTimeout(() => {
      visible = false
    }, LOADING_UNMOUNT_TRESHOLD_MS)
  }

  public render() {
    const { runtime: { extensions } } = this.props
    const { visible: isVisible } = this.state
    const style: CSSProperties = { visibility: 'hidden' }

    return (
      <TreePathContext.Consumer>
        {(value: TreePathProps) => {
          const t = value.treePath
          const loadingType = value.treePath && extensions[t] && extensions[t].preview && extensions[t].preview!.type
          const loadingComponent = loadingType
            ? loadingType === 'text' ? List : Instagram
            : null

          return (
            <div style={isVisible ? undefined : style}>
              { loadingComponent }
            </div>
          )
        }}
      </TreePathContext.Consumer>
    )
  }
}

export default withRuntimeContext<{}>(Loading)

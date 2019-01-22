import React, {CSSProperties, PureComponent} from 'react'
import {Instagram, List} from 'react-content-loader'

import {RenderContextProps, withRuntimeContext} from './RenderContext'

interface State {
  visible?: boolean
}

const LOADING_TRESHOLD_MS = 1000
// If a Loading component unmounts and remounts within this time, it should be visible from the start.
const LOADING_UNMOUNT_TRESHOLD_MS = 1000
let visible = false

const defaultLoading = (
  <div className="flex justify-center w-100 pa4">
    <svg width="26px" height="26px" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink">
      <use xlinkHref="#sti-loading" />
    </svg>
  </div>
)

interface LoadingProps {
  treePath?: string
}

class Loading extends PureComponent<LoadingProps & RenderContextProps, State> {
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
    const { runtime: { extensions }, treePath } = this.props
    const { visible: isVisible } = this.state
    const style: CSSProperties = { visibility: 'hidden' }

    const loadingType = treePath && extensions[treePath] && extensions[treePath].preview && extensions[treePath].preview.type
    const loadingComponent = loadingType
      ? loadingType === 'text' ? List : Instagram
      : defaultLoading

    return (
      <div style={isVisible ? undefined : style}>
        { loadingComponent }
      </div>
    )
  }
}

export default withRuntimeContext<{}>(Loading)

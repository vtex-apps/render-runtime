import React, {CSSProperties, PureComponent} from 'react'
import {getExtensionImplementation} from '../utils/assets'
import {RenderContextProps, withRuntimeContext} from './RenderContext'

interface State {
  visible?: boolean
}

const LOADING_TRESHOLD_MS = 1000
// If a Loading component unmounts and remounts within this time, it should be visible from the start.
const LOADING_UNMOUNT_TRESHOLD_MS = 1000
let visible = false

const defaultStyle = {
  display: 'flex',
  justifyContent: 'center',
  padding: '50px',
  width: '100%',
}

const defaultLoading = (
  <div style={defaultStyle}>
    <svg width="26px" height="26px" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">
      <circle cx="50" opacity="0.4" cy="50" fill="none" stroke="#F71963" strokeWidth="14" r="40"></circle>
      <circle cx="50" cy="50" fill="none" stroke="#F71963" strokeWidth="12" r="40" strokeDasharray="60 900" strokeLinecap="round" transform="rotate(96 50 50)">
        <animateTransform attributeName="transform" type="rotate" calcMode="linear" values="0 50 50;360 50 50" keyTimes="0;1" dur="0.7s" begin="0s" repeatCount="indefinite"></animateTransform>
      </circle>
    </svg>
  </div>
)

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
    const {runtime: {extensions, page}} = this.props
    const {visible: isVisible} = this.state
    const style: CSSProperties = { visibility: 'hidden' }
    const [root] = page.split('/')
    const LoadingExtension = getExtensionImplementation(extensions, `${root}/__loading`)

    return <div style={isVisible ? undefined : style}>
      { LoadingExtension ? <LoadingExtension /> : defaultLoading }
    </div>
  }
}

export default withRuntimeContext(Loading)

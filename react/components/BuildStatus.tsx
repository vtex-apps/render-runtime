import PropTypes from 'prop-types'
import React, {Component} from 'react'
import Loading from './Loading'
import {RenderContextProps, withRuntimeContext} from './RenderContext'

interface State {
  animateOut: boolean
  status: string | null
  anchor: 'left' | 'right'
}

const buildStatusLoading = (
  <svg width="26px" height="26px" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">
    <circle cx="50" opacity="0.4" cy="50" fill="none" stroke="#F71963" strokeWidth="14" r="40"></circle>
    <circle cx="50" cy="50" fill="none" stroke="#F71963" strokeWidth="12" r="40" strokeDasharray="60 900" strokeLinecap="round" transform="rotate(96 50 50)">
      <animateTransform attributeName="transform" type="rotate" calcMode="linear" values="0 50 50;360 50 50" keyTimes="0;1" dur="0.7s" begin="0s" repeatCount="indefinite"></animateTransform>
    </circle>
  </svg>
)

class BuildStatus extends Component<RenderContextProps, State> {
  private animateOutHandle!: number
  private hideHandle!: number

  constructor(props: RenderContextProps) {
    super(props)

    this.state = {
      animateOut: false,
      status: null,
      anchor: 'left',
    }
  }

  public clearTimeouts = () => {
    clearTimeout(this.animateOutHandle)
    clearTimeout(this.hideHandle)
  }

  public hideWithDelay = (delayMillis: number) => {
    this.animateOutHandle = window.setTimeout(() => this.setState({ animateOut: true }), delayMillis)
    this.hideHandle = window.setTimeout(() => this.setState({ status: null, animateOut: false }), delayMillis + 300)
  }

  private toggleAnchor = () => {
    this.setState(state => ({
      anchor: state.anchor === 'left' ? 'right' : 'left'
    }))
  }

  private handleMouseOver = () => {
    this.toggleAnchor()
  }

  public updateStatus = (status: string) => {
    // After we started a reload, the UI shouldn't move.
    if (this.state.status === 'reload') {
      return
    }

    this.setState({status, animateOut: false})
    this.clearTimeouts()

    if (status === 'success' || status === 'hmr:success') {
      const delay = status === 'success' ? 2000 : 0
      this.hideWithDelay(delay)
    }
  }

  public subscribeToStatus = () => {
    const {emitter} = this.props.runtime
    emitter.addListener('build.status', this.updateStatus)
  }

  public unsubscribeToStatus = () => {
    const {emitter} = this.props.runtime
    emitter.removeListener('build.status', this.updateStatus)
  }

  public componentDidMount() {
    this.subscribeToStatus()
  }

  public componentWillUnmount() {
    this.unsubscribeToStatus()
    this.clearTimeouts()
  }

  public render() {
    const {status, animateOut, anchor} = this.state

    if (status === null) {
      return null
    }

    const className = `build-status ${status} z-max fixed animated pa3 bg-near-white br3 rebel-pink flex items-center shadow-4 ${
      animateOut ? 'fadeOut' : 'fadeIn'
    }`

    const fail = (
      <p className="ma2">Oops! Build failed. Check your terminal for more information</p>
    )

    const reload = (
      <p className="ma2">Performing full reload</p>
    )

    return (
      <div
        className={className}
        style={{ top: '12px', [anchor]: '12px', animationDuration: '0.2s', opacity: 0.8 }}
        onMouseOver={this.toggleAnchor}>
        {status === 'fail'
          ? fail
          : status === 'reload'
            ? reload
            : buildStatusLoading}
      </div>
    )
  }
}

export default withRuntimeContext<{}>(BuildStatus)

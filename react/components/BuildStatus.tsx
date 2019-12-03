import React, { Component } from 'react'
import { RenderContextProps, withRuntimeContext } from './RenderContext'

interface State {
  animateOut: boolean
  status: string | null
  anchor: 'left' | 'right'
  interrupted: boolean | null
}

class BuildStatus extends Component<RenderContextProps, State> {
  private animateOutHandle!: number
  private hideHandle!: number

  public constructor(props: RenderContextProps) {
    super(props)

    this.state = {
      animateOut: false,
      status: null,
      interrupted: null,
      anchor: 'left',
    }
  }

  public clearTimeouts = () => {
    clearTimeout(this.animateOutHandle)
    clearTimeout(this.hideHandle)
  }

  public hideWithDelay = (delayMillis: number) => {
    this.animateOutHandle = window.setTimeout(
      () => this.setState({ animateOut: true }),
      delayMillis
    )
    this.hideHandle = window.setTimeout(
      () =>
        this.setState({ status: null, interrupted: null, animateOut: false }),
      delayMillis + 300
    )
  }

  private handleMouseOver = () => {
    this.setState(state => ({
      anchor: state.anchor === 'left' ? 'right' : 'left',
    }))
  }

  public updateStatus = (status: string) => {
    // After we started a reload, the UI shouldn't move.
    if (this.state.status === 'reload') {
      return
    }

    this.setState({ status, animateOut: false })
    this.clearTimeouts()

    if (status === 'success' || status === 'hmr:success') {
      const delay = status === 'success' ? 2000 : 0
      this.hideWithDelay(delay)
    }
  }

  public updateInterrupted = () => {
    this.clearTimeouts()
    this.setState({ interrupted: true, animateOut: false })
    const delay = 2000
    this.hideWithDelay(delay)
  }

  public subscribeToStatus = () => {
    const { emitter } = this.props.runtime
    emitter.addListener('build.status', this.updateStatus)
  }

  public unsubscribeToStatus = () => {
    const { emitter } = this.props.runtime
    emitter.removeListener('build.status', this.updateStatus)
  }

  public subscribeToLinkInterrupted = () => {
    const { emitter } = this.props.runtime
    emitter.addListener('link_interrupted', this.updateInterrupted)
  }

  public unsubscribeToLinkInterrupted = () => {
    const { emitter } = this.props.runtime
    emitter.removeListener('link_interrupted', this.updateInterrupted)
  }

  public componentDidMount() {
    this.subscribeToStatus()
    this.subscribeToLinkInterrupted()
  }

  public componentWillUnmount() {
    this.unsubscribeToStatus()
    this.unsubscribeToLinkInterrupted()
    this.clearTimeouts()
  }

  private renderLoading = () => (
    <svg
      width="26px"
      height="26px"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid"
    >
      <style>{`
        @keyframes build-status-rotate {
            0% {
              transform: rotate(0);
            }
            100% {
              transform: rotate(360deg);
            }
          }

          .build-status-rotate {
            transform-origin: 50px 50px;
            animation: build-status-rotate 0.7s infinite linear;
          }

        `}</style>
      <g>
        <circle
          cx="50"
          opacity="0.4"
          cy="50"
          fill="none"
          stroke="#F71963"
          r="40"
          strokeWidth="14"
        />
        <circle
          cx="50"
          cy="50"
          fill="none"
          stroke="#F71963"
          r="40"
          strokeDasharray="60 900"
          strokeWidth="12"
          strokeLinecap="round"
          className="build-status-rotate"
        />
      </g>
    </svg>
  )

  public render() {
    const { status, animateOut, anchor, interrupted } = this.state

    if (status === null && interrupted === null) {
      return null
    }

    const className = `build-status ${status} z-max fixed animated pa3 bg-near-white br3 rebel-pink flex items-center shadow-4 ${
      animateOut ? 'fadeOut' : 'fadeIn'
    }`

    const fail = (
      <p className="ma2">
        {' '}
        Oops! Build failed. Check your terminal for more information
      </p>
    )

    const reload = <p className="ma2">Performing full reload</p>

    const linkInterrupted = <p className="ma2">Link interrupted</p>

    return (
      // eslint-disable-next-line jsx-a11y/mouse-events-have-key-events
      <div
        aria-hidden
        className={className}
        style={{
          top: '12px',
          [anchor]: '12px',
          animationDuration: '0.2s',
          opacity: 0.8,
        }}
        onMouseOver={this.handleMouseOver}
      >
        {interrupted
          ? linkInterrupted
          : status === 'fail'
          ? fail
          : status === 'reload'
          ? reload
          : this.renderLoading()}
      </div>
    )
  }
}

export default withRuntimeContext<{}>(BuildStatus)

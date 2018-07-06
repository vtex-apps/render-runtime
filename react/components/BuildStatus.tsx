import PropTypes from 'prop-types'
import React, {Component} from 'react'
import Loading from './Loading'
import {RenderContextProps, withContext} from './RenderContext'

interface State {
  animateOut: boolean
  status: string | null
}

class BuildStatus extends Component<RenderContextProps, State> {
  private animateOutHandle!: NodeJS.Timer
  private hideHandle!: NodeJS.Timer

  constructor(props: RenderContextProps) {
    super(props)

    this.state = {
      animateOut: false,
      status: null,
    }
  }

  public clearTimeouts = () => {
    clearTimeout(this.animateOutHandle)
    clearTimeout(this.hideHandle)
  }

  public hideWithDelay = (delayMillis: number) => {
    this.animateOutHandle = setTimeout(() => this.setState({ animateOut: true }), delayMillis)
    this.hideHandle = setTimeout(() => this.setState({ status: null, animateOut: false }), delayMillis + 300)
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
    const {status, animateOut} = this.state

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
      <div className={className} style={{ top: '12px', left: '12px', animationDuration: '0.2s'}}>
        {status === 'fail'
          ? fail
          : status === 'reload'
            ? reload
            : <Loading useDefault />}
      </div>
    )
  }
}

export default withContext<{}>(BuildStatus)

import React, {Component} from 'react'
import PropTypes from 'prop-types'

const loader = (
  <svg width="32px" height="32px" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">
    <circle cx="50" opacity="0.4" cy="50" fill="none" stroke="#F71963" strokeWidth="12" r="40"></circle>
    <circle cx="50" cy="50" fill="none" stroke="#F71963" strokeWidth="10" r="40" strokeDasharray="60 900" strokeLinecap="round" transform="rotate(96 50 50)">
      <animateTransform attributeName="transform" type="rotate" calcMode="linear" values="0 50 50;360 50 50" keyTimes="0;1" dur="0.7s" begin="0s" repeatCount="indefinite"></animateTransform>
    </circle>
  </svg>
)

export default class BuildStatus extends Component {
  static contextTypes = {
    emitter: PropTypes.object,
  }

  constructor(props, context) {
    super(props, context)

    this.state = {
      status: null,
      animateOut: false,
    }
  }

  updateStatus = code => {
    // After we started a reload, the UI shouldn't move.
    if (this.state.status === 'reload') {
      return
    }

    this.setState({
      status: code,
    })

    if (code === 'success') {
      this.animateOutHandle = setTimeout(() => this.setState({ animateOut: true }), 2000)
      this.hideHandle = setTimeout(
        () => this.setState({ status: null, animateOut: false }),
        2400
      )
    } else if (code === 'reload') {
      clearTimeout(this.animateOutHandle)
      clearTimeout(this.hideHandle)
    } else if (code === 'hmr:success') {
      clearTimeout(this.animateOutHandle)
      clearTimeout(this.hideHandle)
      this.setState({ animateOut: true })
      this.hideHandle = setTimeout(
        () => this.setState({ status: null, animateOut: false }),
        400
      )
    }
  }

  subscribeToStatus = () => {
    const {emitter} = this.context
    emitter.addListener('build.status', this.updateStatus)
  }

  unsubscribeToStatus = () => {
    const {emitter} = this.context
    emitter.removeListener('build.status', this.updateStatus)
  }

  componentDidMount() {
    this.subscribeToStatus()
  }

  componentWillUnmount() {
    this.unsubscribeToStatus()
  }

  render() {
    const {status, animateOut} = this.state

    if (status === null) {
      return null
    }

    const className = `build-status z-999 fixed animated pa3 bg-near-white br3 rebel-pink flex items-center shadow-4 ${
      animateOut ? 'fadeOut' : 'fadeIn'
    }`

    const fail = (
      <p className="ma2">Oops! Build failed. Check your terminal for more information</p>
    )

    const reload = (
      <p className="ma2">Performing full reload</p>
    )

    return (
      <div className={className} style={{ top: '20px', left: '20px', animationDuration: '0.2s'}}>
        {status === 'fail'
          ? fail
          : status === 'reload'
            ? reload
            : loader}
      </div>
    )
  }
}

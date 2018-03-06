import React, {Component} from 'react'
import PropTypes from 'prop-types'

export default class BuildStatus extends Component {
  static contextTypes = {
    emitter: PropTypes.object,
  }

  constructor(props, context) {
    super(props, context)

    this.state = {
      status: null,
    }
  }

  updateStatus = (code) => {
    console.log(code)
    this.setState({
      status: code,
    })
    if (code === 'success') {
      setTimeout(() => this.setState({status: null}), 3000)
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
    const {status} = this.state

    if (status === null) {
      return null
    }

    return (
      <div className="build-status">
        <p>Build {status}</p>
      </div>
    )
  }
}

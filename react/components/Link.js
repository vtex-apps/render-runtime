import React from 'react'
import PropTypes from 'prop-types'

const isLeftClickEvent = event => event.button === 0

const isModifiedEvent = event =>
  !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)

const absoluteRegex = /^https?:\/\/|^\/\//i

const isAbsoluteUrl = url => absoluteRegex.test(url)

//eslint-disable-next-line
export default class Link extends React.Component {
  static contextTypes = {
    navigate: PropTypes.func
  }

  static defaultProps = {
    onClick: () => {},
  }

  static propTypes = {
    page: PropTypes.string,
    params: PropTypes.object,
    query: PropTypes.string,
    to: PropTypes.string,
    onClick: PropTypes.func,
  }

  handleClick = (event) => {
    const {page, params, query, to} = this.props
    if (
      isModifiedEvent(event) ||
      !isLeftClickEvent(event) ||
      isAbsoluteUrl(to)
    ) {
      return
    }

    this.props.onClick()

    const options = {page, params, query, to, fallbackToWindowLocation: false}
    if (this.context.navigate(options)) {
      event.preventDefault()
    }
  }

  render() {
    return <a href={this.props.to} {...this.props} onClick={this.handleClick} />
  }
}

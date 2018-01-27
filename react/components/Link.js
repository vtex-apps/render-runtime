import React from 'react'
import PropTypes from 'prop-types'

const isLeftClickEvent = event => event.button === 0

const isModifiedEvent = event =>
  !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)

const createLocationDescriptor = (to, {query}) =>
  query ? {pathname: to, search: query} : to

const absoluteRegex = /^https?:\/\/|^\/\//i

const isAbsoluteUrl = url => absoluteRegex.test(url)

//eslint-disable-next-line
export default class Link extends React.Component {
  constructor(props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
  }

  handleClick(event) {
    const {to, query} = this.props
    if (
      isModifiedEvent(event) ||
      !isLeftClickEvent(event) ||
      isAbsoluteUrl(to)
    ) {
      return
    }

    event.preventDefault()
    const location = createLocationDescriptor(to, {query})
    this.props.onClick()
    global.browserHistory.push(location)
  }

  render() {
    return <a href={this.props.to} {...this.props} onClick={this.handleClick} />
  }
}

Link.defaultProps = {
  onClick: () => {},
}

Link.propTypes = {
  query: PropTypes.string,
  to: PropTypes.string,
  onClick: PropTypes.func,
}

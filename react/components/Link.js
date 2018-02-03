import React from 'react'
import PropTypes from 'prop-types'

const isLeftClickEvent = event => event.button === 0

const isModifiedEvent = event =>
  !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)

const createLocationDescriptor = (to, {query}) => ({
  pathname: to,
  state: {renderRouting: true},
  ...(query && {search: query}),
})

const absoluteRegex = /^https?:\/\/|^\/\//i

const isAbsoluteUrl = url => absoluteRegex.test(url)

//eslint-disable-next-line
export default class Link extends React.Component {
  static contextTypes = {
    history: PropTypes.object,
  }

  static defaultProps = {
    onClick: () => {},
  }

  static propTypes = {
    query: PropTypes.string,
    to: PropTypes.string,
    onClick: PropTypes.func,
  }

  handleClick = (event) => {
    const {to, query} = this.props
    if (
      isModifiedEvent(event) ||
      !isLeftClickEvent(event) ||
      isAbsoluteUrl(to)
    ) {
      return
    }

    this.props.onClick()

    if (this.context.history) {
      const location = createLocationDescriptor(to, {query})
      this.context.history.push(location)
      event.preventDefault()
    }
  }

  render() {
    return <a href={this.props.to} {...this.props} onClick={this.handleClick} />
  }
}

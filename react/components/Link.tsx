import PropTypes from 'prop-types'
import React, { Component, MouseEvent } from 'react'
import { NavigateOptions, pathFromPageName } from '../utils/pages'
import { RenderContextProps, withRuntimeContext } from './RenderContext'

const isLeftClickEvent = (event: MouseEvent<HTMLAnchorElement>) =>
  event.button === 0

const isModifiedEvent = (event: MouseEvent<HTMLAnchorElement>) =>
  !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)

const absoluteRegex = /^https?:\/\/|^\/\//i

const isAbsoluteUrl = (url: string) => absoluteRegex.test(url)

interface Props extends NavigateOptions {
  onClick: (event: any) => void
}

// eslint-disable-next-line
class Link extends Component<Props & RenderContextProps> {
  public static defaultProps = {
    onClick: () => {
      return
    },
  }

  public static propTypes = {
    onClick: PropTypes.func,
    page: PropTypes.string,
    params: PropTypes.object,
    query: PropTypes.string,
    to: PropTypes.string,
  }

  public handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const {
      page,
      params,
      query,
      to,
      scrollOptions,
      runtime: { navigate },
    } = this.props
    if (
      isModifiedEvent(event) ||
      !isLeftClickEvent(event) ||
      (to && isAbsoluteUrl(to))
    ) {
      return
    }

    this.props.onClick(event)

    const options: NavigateOptions = {
      fallbackToWindowLocation: false,
      page,
      params,
      query,
      scrollOptions,
      to,
    }
    if (navigate(options)) {
      event.preventDefault()
    }
  }

  public getHref = ({to, page, pages, params, query}: any) => {
    if (to) {
      return to
    }
    if (page) {
      const path = pathFromPageName(page, pages, params) 
      const qs = query ? `?${query}` : ''
      if (path) {
        return path + qs
      }
    }
    return '#'
  }

  public render() {
    const {
      page,
      params,
      to,
      scrollOptions,
      query,
      runtime: { pages },
      ...linkProps
    } = this.props
    return <a href={this.getHref({ to, page, pages, params, query })} {...linkProps} onClick={this.handleClick} />
  }
}

export default withRuntimeContext<Props>(Link)

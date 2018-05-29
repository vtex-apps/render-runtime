import PropTypes from 'prop-types'
import React, {Component, MouseEvent} from 'react'
import {NavigateOptions, pathFromPageName} from '../utils/pages'
import {RenderContext} from './RenderContext'

const isLeftClickEvent = (event: MouseEvent<HTMLAnchorElement>) => event.button === 0

const isModifiedEvent = (event: MouseEvent<HTMLAnchorElement>) =>
  !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)

const absoluteRegex = /^https?:\/\/|^\/\//i

const isAbsoluteUrl = (url: string) => absoluteRegex.test(url)

interface Props {
  onClick: () => void,
  page?: string,
  params?: any,
  query?: string,
  to?: string,
}

// eslint-disable-next-line
export default class Link extends Component<Props> {
  public static defaultProps = {
    onClick: () => { return },
  }

  public static propTypes = {
    onClick: PropTypes.func,
    page: PropTypes.string,
    params: PropTypes.object,
    query: PropTypes.string,
    to: PropTypes.string,
  }

  public handleClick = (navigate: RenderContext['navigate']) => (event: MouseEvent<HTMLAnchorElement>) => {
    const {page, params, query, to} = this.props
    if (
      isModifiedEvent(event) ||
      !isLeftClickEvent(event) ||
      (to && isAbsoluteUrl(to))
    ) {
      return
    }

    this.props.onClick()

    const options: NavigateOptions = {page, params, query, to, fallbackToWindowLocation: false}
    if (navigate(options)) {
      event.preventDefault()
    }
  }

  public getHref = (pages: RenderContext['pages']) => {
    return this.props.to || this.props.page && pathFromPageName(this.props.page, pages, this.props.params) || '#'
  }

  public render() {
    return (
      <RenderContext.Consumer>
        {runtime =>
          <a href={this.getHref(runtime!.pages)} {...this.props} onClick={this.handleClick(runtime!.navigate)} />
        }
      </RenderContext.Consumer>
    )
  }
}

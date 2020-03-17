import { canUseDOM } from 'exenv'
import React, { Component, MouseEvent, useCallback } from 'react'

import { NavigateOptions, pathFromPageName } from '../utils/pages'
import { getOrFetchServerPage } from '../utils/routes'
import { useRuntime } from './RenderContext'

const isLeftClickEvent = (event: MouseEvent<HTMLAnchorElement>) =>
  event.button === 0

const isModifiedEvent = (event: MouseEvent<HTMLAnchorElement>) =>
  !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)

const absoluteRegex = /^https?:\/\/|^\/\//i
const telephoneRegex = /^tel:/i
const mailToRegex = /^mailto:/i

const isAbsoluteUrl = (url: string) => absoluteRegex.test(url)
const isTelephoneUrl = (url: string) => telephoneRegex.test(url)
const isMailToUrl = (url: string) => mailToRegex.test(url)

interface Props extends NavigateOptions {
  onClick?: (event: React.MouseEvent) => void
  className?: string
  target?: string
}

const Link: React.FunctionComponent<Props> = ({
  page,
  onClick = () => {},
  params,
  to,
  scrollOptions,
  query,
  children,
  modifiers,
  replace,
  modifiersOptions,
  target,
  ...linkProps
}) => {
  const {
    pages,
    navigate,
    rootPath = '',
    route: { domain },
  } = useRuntime()

  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (
        isModifiedEvent(event) ||
        !isLeftClickEvent(event) ||
        (to && (isAbsoluteUrl(to) || isTelephoneUrl(to) || isMailToUrl(to)))
      ) {
        return
      }

      onClick(event)

      const options: NavigateOptions = {
        fallbackToWindowLocation: false,
        page,
        params,
        query,
        rootPath,
        scrollOptions,
        to,
        modifiers,
        replace,
        modifiersOptions,
      }

      // If you pass a target different from "_self" the component
      // will behave just like a normal anchor element
      if ((target === '_self' || !target) && navigate(options)) {
        event.preventDefault()
      }
    },
    [
      to,
      onClick,
      page,
      params,
      query,
      rootPath,
      scrollOptions,
      modifiers,
      navigate,
      replace,
      modifiersOptions,
      target,
    ]
  )

  const getHref = () => {
    if (to) {
      // Prefix any non-absolute paths (e.g. http:// or https://) and non-special links (e.g. mailto: or tel:)
      // with runtime.rootPath
      if (
        rootPath &&
        !to.startsWith('http') &&
        !to.startsWith(rootPath) &&
        !isTelephoneUrl(to) &&
        !isMailToUrl(to)
      ) {
        return rootPath + to
      }
      return to
    }
    if (page) {
      const path = pathFromPageName(page, pages, params)
      const qs = query ? `?${query}` : ''
      if (path) {
        return rootPath + path + qs
      }
    }
    return '#'
  }

  const href = getHref()
  // Href inside admin iframe should omit the `/app/` path
  const hrefWithoutIframePrefix =
    domain && domain === 'admin' && href.startsWith('/admin/app/')
      ? href.replace('/admin/app/', '/admin/')
      : href

  return (
    <LinkWithPrefetch href={href}>
      <a
        target={target}
        href={hrefWithoutIframePrefix}
        {...linkProps}
        onClick={handleClick}
      >
        {children}
      </a>
    </LinkWithPrefetch>
  )
}

interface Props {
  href: string
}

class LinkWithPrefetch extends Component<Props> {
  private href: string | null = null

  componentDidMount() {
    if (canUseDOM && this.href && this.href.startsWith('/')) {
      getOrFetchServerPage({
        path: this.href,
        fetcher: window.fetch,
        query: {},
      })
    }
  }

  render() {
    const { children, href } = this.props
    this.href = href
    return children
  }
}

export default Link

import PropTypes from 'prop-types'
import React, { Component, MouseEvent, useCallback } from 'react'
import { NavigateOptions, pathFromPageName } from '../utils/pages'
import { RenderContextProps, useRuntime } from './RenderContext'

const isLeftClickEvent = (event: MouseEvent<HTMLAnchorElement>) =>
  event.button === 0

const isModifiedEvent = (event: MouseEvent<HTMLAnchorElement>) =>
  !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)

const absoluteRegex = /^https?:\/\/|^\/\//i

const isAbsoluteUrl = (url: string) => absoluteRegex.test(url)

interface Props extends NavigateOptions {
  onClick: (event: any) => void
}

const Link: React.FunctionComponent<Props> = ({
  page,
  onClick,
  params,
  to,
  scrollOptions,
  query,
  ...linkProps
}) => {
  const { pages, navigate } = useRuntime()

  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (
        isModifiedEvent(event) ||
        !isLeftClickEvent(event) ||
        (to && isAbsoluteUrl(to))
      ) {
        return
      }

      onClick(event)

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
    },
    [page, params, query, to, scrollOptions, navigate]
  )

  const getHref = () => {
    if (to) {
      return to
    }
    if (page) {
      return `${pathFromPageName(page, pages, params)}${
        query ? `?${query}` : ''
      }`
    }
    return '#'
  }

  return <a href={getHref()} {...linkProps} onClick={handleClick} />
}

Link.defaultProps = {
  onClick: () => {
    return
  },
}

Link.propTypes = {
  onClick: PropTypes.func,
  page: PropTypes.string,
  params: PropTypes.object,
  query: PropTypes.string,
  to: PropTypes.string,
}

export default Link

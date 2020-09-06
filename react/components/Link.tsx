import React, { MouseEvent, useCallback, useMemo } from 'react'
import { NavigateOptions, pathFromPageName } from '../utils/pages'
import { useRuntime } from './RenderContext'
import { useIsPrefetchActive } from '../hooks/prefetch'
import PrefetchLink from './Prefetch/PrefetchLink'

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
  waitToPrefetch?: number
}

const appendWorkspaceToURL = (
  url: string | undefined,
  workspace: string | undefined
) => {
  if (
    !url ||
    !workspace ||
    workspace === '' ||
    String(url).indexOf('workspace=') > -1
  ) {
    return url
  }

  const separator = String(url).includes('?') ? '&' : '?'
  return url + separator + 'workspace=' + workspace
}

// const addWorkspaceToQueryObject = (
//   query: any,
//   workspace: string | undefined
// ) => {
//   if (!workspace) {
//     return query
//   }
//   if (!query && workspace) {
//     return { workspace }
//   }
//   return {
//     ...(query ?? {}),
//     workspace,
//   }
// }

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
  waitToPrefetch,
  ...linkProps
}) => {
  const {
    pages,
    navigate,
    rootPath = '',
    route: { domain },
    query: queryFromRuntime,
  } = useRuntime()

  // If workspace is set via querystring, keep it
  const workspace = queryFromRuntime?.workspace

  const isPrefetchActive = useIsPrefetchActive()

  const options = useMemo(
    () => ({
      fallbackToWindowLocation: false,
      page,
      params,
      query: workspace ? appendWorkspaceToURL(query ?? '', workspace) : query,
      rootPath,
      scrollOptions,
      to: appendWorkspaceToURL(to, workspace),
      modifiers,
      replace,
      modifiersOptions,
    }),
    [
      page,
      params,
      query,
      workspace,
      rootPath,
      scrollOptions,
      to,
      modifiers,
      replace,
      modifiersOptions,
    ]
  )

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

      // If you pass a target different from "_self" the component
      // will behave just like a normal anchor element
      if ((target === '_self' || !target) && navigate(options)) {
        event.preventDefault()
      }
    },
    [to, onClick, navigate, target, options]
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
        return appendWorkspaceToURL(rootPath + path + qs, workspace)
      }
    }
    return '#'
  }

  const href = appendWorkspaceToURL(getHref(), workspace) ?? ''

  // Href inside admin iframe should omit the `/app/` path
  const hrefWithoutIframePrefix =
    domain && domain === 'admin' && href.startsWith('/admin/app/')
      ? href.replace('/admin/app/', '/admin/')
      : href

  const linkElementProps = {
    target,
    href: hrefWithoutIframePrefix,
    ...linkProps,
    onClick: handleClick,
  }

  if (isPrefetchActive) {
    return (
      <PrefetchLink
        waitToPrefetch={waitToPrefetch}
        page={page}
        options={options}
        {...linkElementProps}
      >
        {children}
      </PrefetchLink>
    )
  }

  return <a {...linkElementProps}>{children}</a>
}

export default Link

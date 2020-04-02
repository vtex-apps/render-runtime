import React, { MouseEvent, useCallback, useEffect } from 'react'
import { parse } from 'graphql'
import { uniqBy, forEach } from 'ramda'
import { useApolloClient } from 'react-apollo'
import { NavigateOptions, pathFromPageName } from '../utils/pages'
import { useRuntime } from './RenderContext'
import { getPageForPath, fetchRouteData, getPageContent } from '../utils/routes'
import { generateExtensions } from '../utils/blocks'
import { hasComponentImplementation, fetchAssets } from '../utils/assets'
import { traverseListOfComponents } from '../utils/components'

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

const getPageToNavigate = (path: string) => {
  return getPageForPath({
    path: path,
    fetcher: fetch,
  })
}

const fetchComponents = async (
  components: any,
  extensions?: Extensions
) => {
  // const { runtime } = this.props
  // In order for only fetching `components`, we create corresponding extensions
  // for them if they weren't passed
  if (!extensions) {
    const componentsNames = Object.keys(components)
    extensions = componentsNames.reduce((acc, component) => {
      acc[component] = { component }
      return acc
    }, {} as RenderRuntime['extensions'])
  }
  const componentsToDownload = Object.values(extensions).reduce<string[]>(
    (acc, extension) => {
      if (!extension) {
        return acc
      }
      if (extension.render === 'lazy') {
        return acc
      }
      if (!hasComponentImplementation(extension.component)) {
        acc.push(extension.component)
      }
      const context = extension?.context?.component
      if (context && !hasComponentImplementation(context)) {
        acc.push(context)
      }
      return acc
    },
    []
  )

  if (componentsToDownload.length === 0) {
    return
  }

  const allAssets = traverseListOfComponents(components, componentsToDownload)
  await fetchAssets(window.__RUNTIME__, allAssets)
}

// const hydrateApolloCache = (
//   queryData: Array<{
//     data: string
//     query: string
//     variables: Record<string, any>
//   }>,
//   client: any
// ) => {
//   forEach(({ data, query, variables }) => {
//     console.log('teste HY')
//     try {
//       client.writeQuery({
//         query: parse(query),
//         data: JSON.parse(data),
//         variables,
//       })
//     } catch (error) {
//       console.warn(
//         `Error writing query from render-server in Apollo's cache`,
//         error
//       )
//     }
//   }, queryData)
// }

const hydrateApolloCache = (
  queryData: Array<{
    data: string
    query: string
    variables: Record<string, any>
  }>,
  client: any
) => {
  return Promise.all(queryData.map(async ({ data, query, variables }) => {
    console.log('testa HYDRATING: ', {data,query,variables})
    try {
      await client.writeQuery({
        query: parse(query),
        data: JSON.parse(data),
        variables,
      })
      console.log('testa DEU CERTO: ', query)
    } catch (error) {
      console.log('testa DEU ERRADO: ', query)
      console.warn(
        `Error writing query from render-server in Apollo's cache`,
        error
      )
    }
  }))
}

const doCrazy = async ({ page, href, pages, client }: any) => {
  if (!window.__RUNTIME__.fidelis) {
    window.__RUNTIME__.fidelis = {}
    window.__RUNTIME__.fidelis.routeData = {}
    window.__RUNTIME__.fidelis.pathData = {}
    // window.__RUNTIME__.fidelis.extensions = {}
    // window.__RUNTIME__.fidelis.routeMap = {}
  }
  // faz pickRuntime pedindo só page
  console.log('teste args: ', { page, href, pages, client })
  if (href && href[0] !== '/') {
    // so funciona com path relativo
    return
  }
  


  if (href !== '/tank-top/p') {
    return
  }
  const navigationData = await getPageToNavigate(href)
  const navigationPage = page ?? navigationData.page
  const declarer = pages[navigationPage]?.declarer

  // console.log('teste vars: ',{
  //   declarer,
  //   routeId: navigationPage,
  //   renderMajor: 8,

  // })
  console.log('teste LETS FETCH ROUTE DATA!')
  const routeData = await fetchRouteData({ apolloClient: client, routeId: navigationPage, declarer })
  window.__RUNTIME__.fidelis.routeData[page] = routeData
  console.log('teste routedata result: ', routeData)

  // const extensions =
  //   !isEmpty(blocksTree) && blocksTree && blocks && contentMap
  //     ? generateExtensions(blocksTree, blocks, contentMap, pages[routeId])
  //     : pageExtensions

  //salvar na window
  const extensions = generateExtensions(routeData.blocksTree, routeData.blocks, routeData.contentMap, pages[navigationPage])
  console.log('teste EXTENSIONS GENERATED: ', extensions)
  const { contentResponse } = navigationData
  window.__RUNTIME__.fidelis.pathData[href] = {}
  if (contentResponse && extensions) {
    Object.assign(routeData.contentMap, JSON.parse(contentResponse.contentMapJSON))
    // userMessages = userMessages.concat(contentResponse.userMessages)
    // routeData.messages = contentResponse.userMessages.length > 0 ? uniqBy(({ key }: any) => key, routeData.messages.concat(contentResponse.userMessages)) : routeData.messages
    for (const {treePath, contentJSON, contentIds} of contentResponse.extensionsContent || []) {
      extensions[treePath]!.content = contentJSON ? JSON.parse(contentJSON) : undefined
      extensions[treePath]!.contentIds = contentIds
    }
    window.__RUNTIME__.fidelis.pathData[href].messages = contentResponse.userMessages.length > 0 ? uniqBy(({ key }: any) => key, routeData.messages.concat(contentResponse.userMessages)) : routeData.messages
  }

  window.__RUNTIME__.fidelis.pathData[href].extensions = extensions
  window.__RUNTIME__.fidelis.pathData[href].routeId = navigationPage
  window.__RUNTIME__.fidelis.pathData[href].matchingPage = navigationData.route
  // window.__RUNTIME__.fidelis.pathData[href] = {
  //   extensions,
  //   routeId: navigationPage,
  //   messages: 
  // }
  // window.__RUNTIME__.fidelis.extensions[href] = extensions
  // window.__RUNTIME__.fidelis.routeMap[href] = navigationPage
  if (navigationData.queryData) {
    await hydrateApolloCache(navigationData.queryData, client)
  }
  await fetchComponents(routeData.components, extensions)
  console.log('teste DONE!')
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
  const client = useApolloClient()
  useEffect(() => {
    doCrazy({ page, href, pages, client })
  }, [])

  return (
    <a
      target={target}
      href={hrefWithoutIframePrefix}
      {...linkProps}
      onClick={handleClick}
    >
      {children}
    </a>
  )
}

export default Link

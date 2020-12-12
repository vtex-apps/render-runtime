# How does prefetch work

## Render Runtime related

The prefetch in render-runtime has a few key concepts:
- The prefetch hook, that is used by the `<Link>` component, which triggers the prefetch at the appropriate moment
- The prefetch context, that holds the state with a bunch o objects that are important for the prefetch logic
- On RenderProvider when a navigation is triggered, we go to the prefetch cache to see if there is data there.

### The Prefetch context

This is the prefetch state interface:
```

interface PrefetchState {
  routesCache: LRUCache<PrefetchRouteData>
  pathsCache: {
    other: LRUCache<PrefetchCacheObject>
    product: LRUCache<PrefetchCacheObject>
    search: LRUCache<PrefetchCacheObject>
  }
  pathsState: Record<string, PathState>
  routePromise: Record<string, RoutePromise | null>
  queue: PQueue
}
```

- routesCache: A LRUCache that holds data for each page (can be pageCache if we want to change). The key is the page id i.e.: 'store.product', 'store.search#category'. Each entry has: the extensions for that page, the components for that page and the messages for that page.
- pathsCache: an object with three LRU caches. One for products, one for search routes and one for any other of page, like landing pages. Each entry has as key the path to it like: '/banana/p', '/department'. The value it stores is an object with: routeId (the page id, like store.product), matchingPage (a data that contains a bunch of information that vary by path and are created by render-server and pages), contentResponse (this holds content, component and messages datas for pages that have unique content for them, will be null if not applicable) and queryData that contains the query data (like product query result, search query result) for that route.
- pathsState: a map that stores data for each path. The key is the path (i.e.: /banana/p). It helps storing quickly the routeId for that path and the status of the request, to prevent concurrency issues.
- routePromise: a map that stores the state of the request of that route/page. The key is the page id (i.e.: store.product). Prevents concurrency issues, like two requests to the same page being done at the same time.
- queue: a promise queue, that allows up to 5. Simultaneous requests promises (each `<Link>` generates only one entry).

In all of these LRU caches, the max age of the data saved is 30min. This prevents users from navigating, leaving the tab opened, then resuming the navigation and seeing really old data.
They have different sizes, but no greater than 100. 

#### PrefetchContextProvider

It wraps all components, on start of the runtime it sets up the queue but leaves if turned off. After receiving the load signal from the browser, it waits a few extra seconds, then turns on the queue and the requests starts. We had to do it because otherwise, the donwload of prefetched components was affecting lighthouse scores.
It also waits for navigation events, when they happen, we clear the queue, and pause it for one second to allow the browser to have some time to request assets and have more free network and connections.

### Prefetch Hook

Its located at react/hooks/prefetch.ts

Before trying to make requests the hook does some logic, including:
- Call navigation route modifiers to parse the given path and get a more uniform result. For example: /Shoes and /shoes are normalized to /shoes, increasing cache hits.
- Check if for that given path, we already have all data required in our LRU caches (page and path data). If we need any data, move on to add request to queue.

#### Requests logic

At this moment we were already started by the promise queue.
We first try to get the path data from the correct LRU path cache. If not available, we will make a request to rewriter => render-server.
This request is done in the structure: `/PATH?__pickRuntime=page,queryData,contentResponse,route`.
For that path we get: the page id for that path (store.product), the query data (the result of the product query, for example), route data (the variables, canonical, built by render-server and pages) and the content response that has data custom data for that path, like content and components.
We then save this data on the appropriate LRU path cache on prefetch state.

After the request is done we now have all data that varies by path.
We can then, if not in cache already, try to fetch data for that page.
To fetch the page data, we do a query on pages-graphql.

```
query RouteData($routeId: String, $declarer: String, $query: String, $device: UserDevice, $renderMajor: Int) {
  prefetchBlocks(input:{ routeId:$routeId, renderMajor:$renderMajor, declarer: $declarer, query: $query, device: $device}) {
    extensionsJSON
    componentsJSON
    messages {
      key
      message
    }
  }
}
```

This query is done with the `no-cache` fetch policy. This means we will not store the result in Apollo-cache (we are already storing in our own cache).
This is necessary otherwise we would save a lot of data and consume too mch memory from our user device.
After this query is done, it is saved in our own LRU cache (routesCache). We store the messages, the extensions for that page and the components for it.

Finally, we can fetch the assets for those components on background (this consumes cpu since we are donwloading Javascript that is processed as it is being downloaded).

This is the end of the "background async" part of prefetch.

### Using the data for navigation

So before the usual navigation in RenderProvider, we now check the populated caches.
For that path you are trying to navigate, we check on pathsState what page that path leads to. Based on this, we can get the correct page data from routesCache and the correct data from the LRU path caches.
With that we can hydrate the apollo cache with queryData.
If the page has custom content, we generate a fresh copy of that page extensions and modify this fresh copy in place witht he custom content.
We update the runtime state as usual and navigation happens.

### When is prefetch triggered/attempted

On desktops: when you hover over the Link component.
On Mobile: when the Link component is displayed on screen.

### Conclusion

We do two requests:
- First to rewriter (eventually render-server): `/PATH?__pickRuntime=page,queryData,contentResponse,route`
- Second to pages-graphql, asking the prefetchBlocks query.

## Render-server
 
Not much was changed, we just made it possible to return `contentResponse` on pickRuntime, so that we can fetch path custom content and components.

## Pages-graphql

We created prefetchBlocks query, a query that only builds the extensions, components and messages for that given page.

## Possible improvements

Do less work on render-server, the pickRuntime triggers the whole runtime and does a lot of processing and at that moment we just want path related data. We could rethink on how things are done.

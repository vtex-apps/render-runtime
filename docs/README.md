# Render Runtime

This app handles runtime execution of React apps in the VTEX IO Platform.

## Table of Contents

- [Exported Components](#exported-components)
	- [Link](#link-1)
	- [NoSSR](#nossr)
- [Navigation](#navigation)
  - [navigate](#navigate)
    - [Navigate options](#navigate-options)
    - [Example](#example)
  - [Link](#link-1)
  - [Other methods](#other-methods)
     - [goBack](#goback)
     - [setQuery](#setQuery)
## Exported Components

### Link
Navigation related component that, when clicked, redirects to another route. Details [here](#link-1).

### NoSSR
This wrapper component removes its children from the subject of the Server Side Rendering(SSR). It may be useful for Components that use DOM related data _(e.g: document)_. You can provide an optional prop _onSSR_ with a component to render instead when in SSR mode.

```javascript
<NoSSR onSSR={<div>Loading...</div>}>
  <DomRelatedComponent/>
</NoSSR>
```

In addition, you can use it as a React hook, with `useSSR`.

```javascript
const isSSR = useSSR()

if (isSSR) {
  return <div>Loading...</div>
}

return <DomRelatedComponent/>
```


## Navigation
The Render framework provides a built-in navigation solution that provides great experience and modularity for our sites. Building a store, alongside `blocks.json` and ` interfaces.json`, you can provide a `routes.json` file that describes **routes** that a user is able to access. A route looks like this:
```
"store.product": {
	"path": "/:slug/p"
},
```
_Extracted from [vtex-store](https://github.com/vtex-apps/store/blob/master/store/routes.json)_

In this example, `store.product` represents a **block** that renders a specific template, and `/:slug/p` represents the URL path that match with that product block.

**We provide two solutions for navigation inside our Render apps:** the `navigate` method exported from `render-runtime`, and the `Link` component. You can also only set query parameters using the `setQuery` method.

### `navigate`
This method is the most powerful solution for navigation and can be used inside a React Component's lifecycle. It may be injected with the HOC `withRuntimeContext` or, preferably, with the `useRuntime` hook.
```javascript
import { useRuntime, withRuntimeContext } from 'vtex.render-runtime'
...
const MyComponent = () => {
  const { navigate }  = useRuntime()
}

// OR

const MyOtherComponent = ({ navigate }) => {
}

export withRuntimeContext(MyOtherComponent)
```

You can pass a handful of configuration props to navigate:

#### Navigate options

| Name      | Type          | Default  | Description |
| :------------- |:-------------| :-----|:-----|
| fallbackToWindowLocation     | `boolean`   | `false`  |If `true`, sets the href of `window.location` with the future path
| fetchPage     | `boolean`   | `true`  | If `false`, won't fetch navigation assets in `pages-graphql`
| page     | `string`  | --  | Name of the page that will be redirected to. Maps to a `blocks.json` block. Example: `'store.product'`
| to     | `string`    |  --  | Alternatively to `page`, you can pass the whole URL directly instead of the page name (Useful for the `search-result`). Example: `/shirt/p?skuId=1`
| params | `object`      |   `{}`  | Map of _parameters_ names in the path for the page and the values that should replace them. Example: `{slug: 'shirt'}`
| query | `string`  | `''`   | String representation of the query params that will be appended to the path. Example: `skuId=231`.
| scrollOptions | `RenderScrollOptions` | -- | After the navigation, if the page should be scrolled to a specific position, or should stay still (use `false`)
#### Example
```javascript
navigate({
  page: 'store.search',
  params: { department: 'accessories' },
  query: 'order=OrderByPrice',
  scrollOptions: { baseElementId: 'search-result-anchor', top: -HEADER_SCROLL_OFFSET },
})
```

### Link
Link is a custom React component that renders an `a` HTML element that, when clicked, navigates the user to the provided route. It has a similar API with the `navigate` method.

#### Props

| Name      | Type          | Default  | Description |
| :------------- |:-------------| :-----|:-----|
| page     | `string`  | --  | Name of the page that will be redirect to. Maps to a `blocks.json` block. Example: `'store.product'`
| to     | `string`    |  --  | Alternatively to `page`, you can pass the whole URL directly instead of the page name (Useful for the `search-result`). Example: `/shirt/p?skuId=1`
| params | `object`      |   `{}`  | Map of _param_ names in the path for the page and the values that should replace them. Example: `{slug: 'shirt'}`
| query | `string`  | `''`   | String representation of the query params that will be appended to the path. Example: `skuId=231`.
| onClick | `function` | -- | Callback that will be fired when the user click on the Component. Example: `() => alert('Salut')`

Other props you pass will be forwarded to the `a` component and can be used for customisation.

#### Use Example
```javascript
import { Link } from 'render-runtime'
  <Link
    page={linkprops.page}
    query={linkprops.querystring}
    params={linkprops.params}
    classname="c-on-base f5 ml-auto db no-underline pv4 ph5 hover-bg-muted-4"
  >
   {option.label}
  </Link>
```
_Extracted from [vtex.search-result](https://github.com/vtex-apps/search-result/blob/c02540b274c0169fac20d0382bde83d128e84752/react/components/SelectionListOrderBy.js)_

### Other methods

#### goBack
This method has no parameters and can be called to return the user to the last navigated page.
```javascript
const { goBack } = useRuntime()
...
goBack()
```
#### setQuery
This auxiliary method changes the current page's query string without fetching navigation data to `pages-graphql`. It operates in the same way that React's  `setState`does, merging the passed queries to the current ones. You can also specify to replace all of the queries.
```javascript
setQuery(query, options)
```
##### Parameters
| Name      | Type          | Default  | Description |
| :------------- |:-------------| :-----|:-----|
| query     | `object`  | -- | Object describing the query E.g: `{ order: 'price' }`
| options     | `object`  | -- | Configuration. _Described below_
##### Options
| Name      | Type          | Default  | Description |
| :------------- |:-------------| :-----|:-----|
| merge     | `boolean`  | `true` | Set if the passed queries will be merged into the current ones.
| replace  | `boolean`  | `false` | If `true`, it uses _history_'s replace method instead of push.
| scrollOptions  | `RenderScrollOptions`  | `false` | After the navigation, if the page should be scrolled to a specific position, or should stay still (use `false`)

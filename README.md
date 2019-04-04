# Render Runtime

This app handles runtime execution of React apps in the VTEX IO Platform.

## Table of Contents

- [Components](#components)
- [Navigation](#navigation)
  - [navigate](#navigate)
    - [Navigate options](#navigate-options)
    - [Example](#example)
  - [Link](#link)

## Components 

- Link
- NoSSR
- ExtensionPoint
- ExtensionContainer


## Navigation
The Render framework provides a built-in navigation solution that provides great experience and modularity for our sites. Building a store, alongside `blocks.json` and ` interfaces.json`, you can provide a `routes.json` file that describes **routes** that a user is able to access. A route look like this:
```
"store.product": {
	"path": "/:slug/p"
},
```
_Extracted from [vtex-store](https://github.com/vtex-apps/store/blob/master/store/routes.json)_

In this example, `store.product` represents an **block** that render a specific template, and `/:slug/p` represents the URL path that match with that product block and render its template.

**We provide two solutions for navigation inside our Render apps:** the `navigate` method exported from `render-runtime`, and the `Link` component. One can also only change query params using the `setQuery` method.

### `navigate`
This method is the most powerful solution for navigation and can be used inside a React Component's lifecycle. It may be injected with the HOC `withRuntimeContext` or, preferably, with the `useRuntime` hook.
```javascript
import { useRuntime, withRuntimeContext } from 'vtex.render-runtime'
...
const MyComponent = () => {
	const { navigate }  = useRuntime()
// OR
const MyOtherComponent = ({ navigate }) => {
...
export withRuntimeContext(MyOtherComponent)
```

One can pass a handful of configuration props to navigate: 

#### Navigate options

| Name      | Type          | Default  | Description | 
| :------------- |:-------------| :-----|:-----|
| fallbackToWindowLocation     | `boolean`   | `false`  |If `true`, will set the href of `window.location` with the future path
| fetchPage     | `boolean`   | `true`  | If false, will not fetch navigation assets in `pages-graphql`
| page     | `string`  | --  | Name of the page that the component will redirect to. Maps to a `blocks.json` block. Example: `'store.product'`
| to     | `string`    |  --  | Alternatively to `page`, you can pass the URL directly instead of the page name (Useful for the `search-result`). Example: `/:slug/p`
| params | `object`      |   `{}`  | Map of _param_ names in the path for the page and the values that should replace them. Example: `{slug: 'shirt'}`
| query | `string`  | `''`   | String representation of the query params that will be appended to the path. Example: `skuId=231`.
| scrollOptions | `RenderScrollOptions` | -- | After the navigation, if the page should be scrolled to a specific position, or should stay still (use `false`)
#### Example
```javascript
navigate({
  page: 'store.search',
  params: { department: 'accessories' },
  query: { 'order=OrderByPrice' },
  scrollOptions: { baseElementId: 'search-result-anchor', top: -HEADER_SCROLL_OFFSET },
})
```

### Link
Link is a custom React component that renderes a `a` HTML element that, when clicked, will navigate the user to the provided route. It has a similar API with the `navigate` method.

#### Props

| Name      | Type          | Default  | Description | 
| :------------- |:-------------| :-----|:-----|
| page     | `string`  | --  | Name of the page that the component will redirect to. Maps to a `blocks.json` block. Example: `'store.product'`
| to     | `string`    |  --  | Alternatively to `page`, you can pass the URL directly instead of the page name (Useful for the `search-result`). Example: `/:slug/p`
| params | `object`      |   `{}`  | Map of _param_ names in the path for the page and the values that should replace them. Example: `{slug: 'shirt'}`
| query | `string`  | `''`   | String representation of the query params that will be appended to the path. Example: `skuId=231`.
| onClick | `function` | -- | Callback that will be fired when the user click on the Component. Example: `() => alert('Salut')`

Other props you pass will be forwarded to the `a` component and can be used for customisation.

#### Use Example
```javascript
import { Link } from 'render-runtime'
	{...}
	<Link
	  page={linkProps.page}
	  query={linkProps.queryString}
	  params={linkProps.params}
	  className="c-on-base f5 ml-auto db no-underline pv4 ph5 hover-bg-muted-4"
	>
	  {option.label}
	</Link>
```
_Extracted from [vtex.search-result](https://github.com/vtex-apps/search-result/blob/master/react/components/SelectionListOrderBy.js)_

### Other methods

#### goBack
...
#### setQuery
...

# Render Runtime

The Render Runtime app is responsible for handling runtime execution of React apps in the VTEX IO Platform. Additionally, it exports:

- Helpful variables, such as [`canUseDOM`](#canusedom).
- Hooks, such as [`useRuntime`](#useruntime).
- React components, such as [`Block` (alias `ExtensionPoint`)](#block-alias-extensionpoint), [`Helmet`](#helmet), [`Link`](#link), and [`NoSSR`](#nossr).

> ℹ️ **Tip:** Run vtex setup --typings to add vtex.render-runtime types in your app. This way, IDEs will be able to provide autocomplete for variables and methods.

Check the following sections for more information on the objects exported by the Render Runtime app.

# Variables

## canUseDOM

A *boolean* value that indicates whether the code is running in a browser environment (`true`) or in a Node/SSR environment (`false`). 

> ℹ️ Notice that the `canUseDOM` variable is especially useful in cases the components use DOM related data _(e.g: `document` or `window`)_.

Take the following usage example:

```tsx
import React from 'react'
import { canUseDOM } from 'vtex.render-runtime'

function MyComponent() {
  const data = canUseDOM
    ? window.localStorage.getItem('foo')
    : ''

  return <div>Hello</div>
}

export default MyComponent
```

# Hooks

## useRuntime

The `useRuntime` React hook is useful when creating components since it provides runtime contextual variables and methods.

For an example on its usage, check the following snippet:

```tsx
import React from 'react'
import { useRuntime } from 'vtex.render-runtime'

function MyComponent() {
  const runtime = useRuntime()

  return <div>Hello</div>
}
```

Inside the `runtime` object you can have access to the following variables:

| Name          | Type   | Description              |
|:--------------|:-------|:-------------------------|
|[`account`](#account)     |string  |The VTEX account name, (e.g., `storecomponents`).    |
|[`binding`](#binding)     |object  |An object containing the `id` and `canonicalBaseAddress` of the store binding. |
|[`culture`](#culture)      |object  |An object containing culture, currency and locale information. |
|[`deviceInfo`](#deviceinfo)  |object  |An object specifying the user device type (`phone`, `desktop`, `tablet`, or `unknown`). *This data varies when the user resizes the window.*|
|[`getSettings`](#getsettings)  |function|A function that, when called, returns the public `settings` of an app.|
|[`hints`](#hints)      |object  | An object which specifies the user device type (`phone`, `desktop`, `tablet`, or `unknown`) based on the information provided by the CDN. *Different from `deviceInfo` this data is static.*|
|[`history`](#history)|object  |A `history` object reexported from the `history` package. For further information, check [this link.](https://github.com/ReactTraining/history/tree/v4/docs)|
|[`navigate`](#navigate)|function|A function used in the client-side to define the navigation behaviour. |
|[`page`](#page)|string  |The current `page` id (e.g., `store.home`).|
|[`production`](#production)|boolean |Points if the app is in a production workspace (`true`) or not (`false`). |
|[`query`](#query)|object  |The URL query string values in a key-value format (e.g., `{ "foo": "bar" }`).|
|[`renderMajor`](#rendermajor)|number  |The major version of the Render Runtime app.|
|[`rootPath`](#rootpath)|string  |The store root path (e.g., `/ar`). If not specified, its value is `undefined`.|
|[`setQuery`](#setquery)|function|A function that can be called to set query string params.|
|[`workspace`](#workspace)|string  |The current workspace name (e.g., `master`).|

### Usage examples

Check the following section for usage examples on how to use the internal `runtime` variables.

#### `account`

```tsx
import React from 'react'
import { useRuntime } from 'vtex.render-runtime'

function MyComponent() {
  const { account } = useRuntime()

  return <div>Welcome to {account}</div>
}

export default MyComponent
```

#### `binding`

```tsx
import React from 'react'
import { useRuntime } from 'vtex.render-runtime'

function MyComponent() {
  const { binding } = useRuntime()

  return <div>Canonical address is "{binding.canonicalBaseAddress}"</div>
}

export default MyComponent
```

*Type:*

```tsx
interface BindingInfo {
  id: string
  canonicalBaseAddress: string
}
```

*Example value:*

```json
{
  "id": "aacb06b3-a8fa-4bab-b5bd-2d654d20dcd8",
  "canonicalBaseAddress": "storetheme.vtex.com/"
}
```

#### `culture`


```tsx
import React from 'react'
import { useRuntime } from 'vtex.render-runtime'

function MyComponent() {
  const { culture } = useRuntime()

  return <div>Current active locale is: "{culture.locale}"</div>
}

export default MyComponent
```

*Type:*

```tsx
interface Culture {
  availableLocales: string[]
  country: string
  currency: string
  language: string
  locale: string
  customCurrencyDecimalDigits: number | null
  customCurrencySymbol: string | null
}
```

*Example value:*

```json
{
  "availableLocales": [],
  "country": "USA",
  "currency": "USD",
  "language": "en",
  "locale": "en-US",
  "customCurrencyDecimalDigits": null,
  "customCurrencySymbol": "$"
}
```

#### `deviceInfo`

```tsx
import React from 'react'
import { useRuntime } from 'vtex.render-runtime'

function MyComponent() {
  const { deviceInfo } = useRuntime()

  return <div>This page is being rendered on a "{deviceInfo.type}"</div>
}

export default MyComponent
```

*Type:*
```tsx
interface DeviceInfo {
  isMobile: boolean
  type: 'phone' | 'tablet' | 'desktop' | 'unknown'
}
```

*Example value:*
```json
{
  "isMobile": false,
  "type": "desktop"
}
```

#### `getSettings`

```tsx
import React from 'react'
import { useRuntime } from 'vtex.render-runtime'

function MyComponent() {
  const { getSettings } = useRuntime()
  const settings = getSettings('vtex.store')

  return <div>This is the store's name: "{settings.storeName}"</div>
}

export default MyComponent
```

#### `hints`

```tsx
import React from 'react'
import { useRuntime } from 'vtex.render-runtime'

function MyComponent() {
  const { hints } = useRuntime()

  if (!hints.desktop) {
    return <div>This is not a desktop</div>
  }

  return <div>This is a desktop</div>
}

export default MyComponent
```

*Type:*

```tsx
interface Hints {
  desktop: boolean
  mobile: boolean
  tablet: boolean
  phone: boolean
  unknown: boolean
}
```

*Example value:*

```json
{
  "desktop": true,
  "mobile": false,
  "tablet": false,
  "phone": false,
  "unknown": false,
}
```

#### `history`

```tsx
import React from 'react'
import { useRuntime } from 'vtex.render-runtime'

function MyComponent() {
  const { history } = useRuntime()

  const handleClick = () => {
    history.goBack()
  }

  return <button onClick={handleClick}>Back</button>
}

export default MyComponent
```

#### `navigate`

```tsx
import React from 'react'
import { useRuntime } from 'vtex.render-runtime'

function MyComponent() {
  const { navigate } = useRuntime()

  const handleClick = () => {
    navigate({
      to: '/other-page'
    })
  }

  return <button onClick={handleClick}>Go</button>
}

export default MyComponent
```

*Function param:*

```tsx
interface NavigateOptions {
  fallbackToWindowLocation?: boolean
  hash?: string
  page?: string
  params?: any
  query?: any
  replace?: boolean
  rootPath?: string
  scrollOptions?: false | {
    baseElementId: string,
    behavior: 'auto' | 'smooth'
    left: number
    top: number
  }
  skipSetPath?: boolean
  to?: string
}
```

#### `page`

```tsx
import React from 'react'
import { useRuntime } from 'vtex.render-runtime'

function MyComponent() {
  const { page } = useRuntime()

  return <div>This is the current page id: "{page}"</div>
}

export default MyComponent
```

#### `production`

```tsx
import React from 'react'
import { useRuntime } from 'vtex.render-runtime'

function MyComponent() {
  const { production } = useRuntime()

  if (!production) {
    return <div>This is not a production workspace</div>
  }

  return <div>This is a production workspace</div>
}

export default MyComponent
```

#### `query`

```tsx
import React from 'react'
import { useRuntime } from 'vtex.render-runtime'

function MyComponent() {
  const { query } = useRuntime()

  return <div>The current query strings are {JSON.stringify(query)}</div>
}

export default MyComponent
```

#### `renderMajor`

```tsx
import React from 'react'
import { useRuntime } from 'vtex.render-runtime'

function MyComponent() {
  const { renderMajor } = useRuntime()

  return <div>This page is rendered using vtex.render-runtime@{renderMajor}.x</div>
}

export default MyComponent
```

#### `rootPath`

```tsx
import React from 'react'
import { useRuntime } from 'vtex.render-runtime'

function MyComponent() {
  const { rootPath } = useRuntime()

  if (!rootPath) {
    return <div>The store doesn't have a rootPath set</div>
  }

  return <div>The store rootPath is "{rootPath}"</div>
}

export default MyComponent
```

#### `setQuery`

```tsx
import React from 'react'
import { useRuntime } from 'vtex.render-runtime'

function MyComponent() {
  const { setQuery } = useRuntime()

  const handleClick = () => {
    setQuery({ foo: 'bar' })
  }

  return <button>Set</button>
}

export default MyComponent
```

#### `workspace`

```tsx
import React from 'react'
import { useRuntime } from 'vtex.render-runtime'

function MyComponent() {
  const { workspace } = useRuntime()

  return <div>This is the {workspace} workspace</div>
}

export default MyComponent
```

# Components

## Block (alias ExtensionPoint)

`Block` is a React component used to create Store Framework blocks. 

For implementation details, take the following example. 

> ℹ️ *Notice that the `Block` component will always expect a specific block `id`.*

```tsx
import React from 'react'
import { Block } from 'vtex.render-runtime'
// or
// import { ExtensionPoint } from 'vtex.render-runtime'

function MyComponent() {
  return (
    <div>
      Foobar
      <Block id="my-other-block" />
      {/* or <ExtensionPoint id="my-other-block" /> */}
    </div>
  )
}

export default MyComponent
```

## Helmet

`Helmet` is a component used to add HTML tags inside the `<head>` tag of a page. Take the following example:

> ℹ️ `Helmet` is a reexport of [the `Helmet` component from the `react-helmet` library](https://github.com/nfl/react-helmet/tree/release/5.2.0).

```tsx
import React from 'react'
import { Helmet } from 'vtex.render-runtime'

function MyComponent() {
  return (
    <>
      <Helmet>
        <meta property="og:type" content="article" />
      </Helmet>
    </>
  )
}

export default MyComponent
```

## Link

The `Link` React component is responsible for rendering an `a` HTML element that, when clicked, navigates the user to the provided route.

> ℹ️ Notice that the `Link` component has a similar API to the `navigate` method from the [`useRuntime`](#useruntime) hook.

| Name      | Type          | Description | Default  |
| :------------- |:-------------| :-----|:-----|
| `page`     | `string`  | The name of the page that the user will be redirected to. Maps to a `blocks.json` block (e.g., `'store.product'`)||
| `to`     | `string`    |The URL of the page that the user will be redirected to (e.g., `/shirt/p?skuId=1`). Notice that `to` is an **alternative** to `page` and it contains the whole URL instead of the page name. | |
| `params` | `object`      | The `param` values of the page path in a key-value format (e.g, `{slug: 'shirt'}`). | `{}`|
| `query` | `string`  | The representation of the query params that are appended to the page path (e.g., `skuId=231`.) | `''` |
| `onClick` | `function` | A callback that is fired when the user clicks on a component (e.g., `() => alert('Salut')`) | |
| `replace` | `boolean` | The boolean value used to indicate if it should call (`true`) the replace function to navigate or not (`false`) | |

Other props you pass will be forwarded to the `a` component and can be used for customization.

Take the following usage example:

```tsx
import React from 'react'
import { Link } from 'vtex.render-runtime'

function MyComponent() {
  return <Link to="/otherpage" classname="c-on-base">Hello</Link>
}

export default MyComponent
```

## NoSSR

> ⚠️ We always recommend using the [`canUseDOM`](#canusedom) variable when possible.

`NoSSR` is a React component that avoids rendering its children during Server-Side Rendering (SSR).

> ℹ️ Notice that the `NoSSR` component is especially useful in cases the components use DOM related data _(e.g: `document` or `window`)_.

Take the following usage example:

```tsx
import React from 'react'
import { NoSSR } from 'vtex.render-runtime'

import DomRelatedComponent from './DomRelatedComponent'

function MyComponent() {
  return (
    <NoSSR onSSR={<div>Loading...</div>}>
      <DomRelatedComponent/>
    </NoSSR>
  )
}
```

Notice that, when in SSR mode, you can optionally provide the `onSSR` prop together with a component to render instead.

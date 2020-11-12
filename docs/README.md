# Render Runtime

This app handles runtime execution of React apps in the VTEX IO Platform and exports some helpful React components, React hooks and variable.

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=2 orderedList=false} -->

<!-- code_chunk_output -->

- [`useRuntime`](#useruntime)
- [Block (alias ExtensionPoint)](#block-alias-extensionpoint)
- [canUseDOM](#canusedom)
- [Helmet](#helmet)
- [Link](#link)
- [NoSSR](#nossr)

<!-- /code_chunk_output -->

## useRuntime

A React hook that provides some functions and variables that are useful when creating components.

**Usage:**

```tsx
import React from 'react'
import { useRuntime } from 'vtex.render-runtime'

function MyComponent() {
  const runtime = useRuntime()

  return <div>Hello</div>
}
```

Inside the object `runtime` you can find:
<!-- @import "[TOC]" {cmd="toc" depthFrom=3 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

- [`account`](#account)
- [`binding`](#binding)
- [`culture`](#culture)
- [`deviceInfo`](#deviceinfo)
- [`getSettings`](#getsettings)
- [`hints`](#hints)
- [`history`](#history)
- [`navigate`](#navigate)
- [`page`](#page)
- [`production`](#production)
- [`query`](#query)
- [`renderMajor`](#rendermajor)
- [`rootPath`](#rootpath)
- [`setQuery`](#setquery)
- [`workspace`](#workspace)

<!-- /code_chunk_output -->

### `account`

A _string_ with the name of the account.

**Usage:**
```tsx
import React from 'react'
import { useRuntime } from 'vtex.render-runtime'

function MyComponent() {
  const { account } = useRuntime()

  return <div>Hello</div>
}

export default MyComponent
```

**Example value:**
`"storecomponents"`

### `binding`


An _object_ with the current binding information.

**Usage:**
```tsx
import React from 'react'
import { useRuntime } from 'vtex.render-runtime'

function MyComponent() {
  const { binding } = useRuntime()

  return <div>Hello</div>
}

export default MyComponent
```

**Type:**
```tsx
interface BindingInfo {
  id: string
  canonicalBaseAddress: string
}
```

**Example value:**
```json
{
  "id": "aacb06b3-a8fa-4bab-b5bd-2d654d20dcd8",
  "canonicalBaseAddress": "storetheme.vtex.com/"
}
```

### `culture`

An _object_ with the culture, currency and locale information.

**Usage:**
```tsx
import React from 'react'
import { useRuntime } from 'vtex.render-runtime'

function MyComponent() {
  const { culture } = useRuntime()

  return <div>Hello</div>
}

export default MyComponent
```

**Type:**
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

**Example value:**
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

### `deviceInfo`

An _object_ with information about the user device, whether it's mobile, desktop or tablet. It can change if the user resizes the window.

**Usage:**
```tsx
import React from 'react'
import { useRuntime } from 'vtex.render-runtime'

function MyComponent() {
  const { deviceInfo } = useRuntime()

  return <div>Hello</div>
}

export default MyComponent
```

**Type:**
```tsx
interface DeviceInfo {
  isMobile: boolean
  type: 'phone' | 'tablet' | 'desktop' | 'unknown'
}
```

**Example value:**
```json
{
  "isMobile": false,
  "type": "desktop"
}
```

### `getSettings`

A _function_ that get the public settings of an app.

**Usage:**
```tsx
import React from 'react'
import { useRuntime } from 'vtex.render-runtime'

function MyComponent() {
  const { getSettings } = useRuntime()
  const settings = getSettings('vtex.store')

  return <div>Hello</div>
}

export default MyComponent
```

### `hints`

An _object_ with information about the user device, whether it's mobile, desktop or tablet based on the information provided by the CDN. Different from `deviceInfo` this data is static.

**Usage:**
```tsx
import React from 'react'
import { useRuntime } from 'vtex.render-runtime'

function MyComponent() {
  const { hints } = useRuntime()

  return <div>Hello</div>
}

export default MyComponent
```

**Type:**
```tsx
interface Hints {
  desktop: boolean
  mobile: boolean
  tablet: boolean
  phone: boolean
  unknown: boolean
}
```

**Example value:**
```json
{
  "desktop": true,
  "mobile": false,
  "tablet": false,
  "phone": false,
  "unknown": false,
}
```

### `history`

A `history` object reexported from history package. 

Docs at: https://github.com/ReactTraining/history/tree/v4/docs

**Usage:**
```tsx
import React from 'react'
import { useRuntime } from 'vtex.render-runtime'

function MyComponent() {
  const { history } = useRuntime()

  return <div>Hello</div>
}

export default MyComponent
```

### `navigate`

A _function_ that should be use to make a client-side navigation.

**Usage:**
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

**Params:**

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

### `page`

A _string_ value of the current page.

**Usage:**
```tsx
import React from 'react'
import { useRuntime } from 'vtex.render-runtime'

function MyComponent() {
  const { page } = useRuntime()

  return <div>Hello</div>
}

export default MyComponent
```

**Example value:**
`"store.home"`

### `production`

A _boolean_ value whether is in a production workspace or not.

**Usage:**
```tsx
import React from 'react'
import { useRuntime } from 'vtex.render-runtime'

function MyComponent() {
  const { production } = useRuntime()

  return <div>Hello</div>
}

export default MyComponent
```

**Example value:**
`false`

### `query`

An _object_ that stores the query string values in a key-value format.

**Usage:**
```tsx
import React from 'react'
import { useRuntime } from 'vtex.render-runtime'

function MyComponent() {
  const { query } = useRuntime()

  return <div>Hello</div>
}

export default MyComponent
```

**Example value:**
`{ "foo": "bar" }`


### `renderMajor`

A _number_ with the major version of Render Runtime.

**Usage:**
```tsx
import React from 'react'
import { useRuntime } from 'vtex.render-runtime'

function MyComponent() {
  const { renderMajor } = useRuntime()

  return <div>Hello</div>
}

export default MyComponent
```

**Example value:**
`8`

### `rootPath`

A _string_ with the root path of the store. It can be `undefined` if none is set.

**Usage:**
```tsx
import React from 'react'
import { useRuntime } from 'vtex.render-runtime'

function MyComponent() {
  const { rootPath } = useRuntime()

  return <div>Hello</div>
}

export default MyComponent
```

**Example value:**
`/ar/`

### `setQuery`

A _function_ that can be called to set query string params.

**Usage:**
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

### `workspace`

A _string_ with the current workspace name.

**Usage:**
```tsx
import React from 'react'
import { useRuntime } from 'vtex.render-runtime'

function MyComponent() {
  const { workspace } = useRuntime()

  return <div>Hello</div>
}

export default MyComponent
```

**Example value:**
`master`

## Block (alias ExtensionPoint)

A React component that is used to create Store Framework blocks that expects a specific block id.

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

## canUseDOM

A _boolean_ whether is code is running in a browser environment or node environment (SSR). It may be useful for Components that use DOM related data _(e.g: `document` or `window`)_.

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

## Helmet

Useful to add HTML tags inside the `<head>` tag of the page.

Reexport of the `Helmet` component from the `react-helmet` library.
Docs: https://github.com/nfl/react-helmet/tree/release/5.2.0

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

A React component that renders an `a` HTML element that, when clicked, navigates the user to the provided route. It has a similar API with the `navigate` method.

**Usage:**
```tsx
import React from 'react'
import { Link } from 'vtex.render-runtime'

function MyComponent() {
  return <Link to="/otherpage" classname="c-on-base">Hello</Link>
}

export default MyComponent
```

*Props:*

| Name      | Type          | Default  | Description |
| :------------- |:-------------| :-----|:-----|
| `to`     | `string`    |  --  | Alternatively to `page`, you can pass the whole URL directly instead of the page name (Useful for the `search-result`). Example: `/shirt/p?skuId=1`
| `page`     | `string`  | --  | Name of the page that will be redirect to. Maps to a `blocks.json` block. Example: `'store.product'`
| `params` | `object`      |   `{}`  | Map of _param_ names in the path for the page and the values that should replace them. Example: `{slug: 'shirt'}`
| `query` | `string`  | `''`   | String representation of the query params that will be appended to the path. Example: `skuId=231`.
| `onClick` | `function` | -- | Callback that will be fired when the user click on the Component. Example: `() => alert('Salut')`
| `replace` | `boolean` | `undefined` | If it should call the replace function to navigate or not

Other props you pass will be forwarded to the `a` component and can be used for customisation.

## NoSSR

> Prefer `canUseDOM` when possible.

A React component that avoid its children during Server Side Rendering (SSR). It may be useful for Components that use DOM related data _(e.g: `document` or `window`)_. You can provide an optional prop _onSSR_ with a component to render instead when in SSR mode.

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

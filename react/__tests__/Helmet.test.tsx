import React from 'react'
import { render, cleanup } from '@vtex/test-tools/react'

// We don't rely on `react-helmet`'s actual DOM side effects here (they
// require a real `canUseDOM` client environment that this jsdom test
// setup doesn't provide). Instead we mock `react-helmet`'s `Helmet` with
// a component that just records the props/children it receives, so we
// can assert on exactly what our wrapper decided to forward -- which is
// the whole surface of the de-duplication logic we're testing.
let lastRenderedProps: any = null

jest.mock('react-helmet', () => ({
  Helmet: (props: any) => {
    lastRenderedProps = props
    return null
  },
}))

// `Helmet` keeps a module-scoped `Set` of already-requested script `src`
// values so de-duplication survives across independently-mounted
// component instances (that's the whole point of the feature). Because
// that state lives at module scope, it persists across tests unless we
// force a fresh module instance every time.
const loadHelmet = (): typeof import('../components/Helmet').default => {
  jest.resetModules()
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('../components/Helmet').default
}

const renderedScriptSrcs = () =>
  (lastRenderedProps?.script ?? [])
    .filter((script: any) => script && typeof script.src === 'string')
    .map((script: any) => script.src)

const renderedChildScriptSrcs = () =>
  React.Children.toArray(lastRenderedProps?.children)
    .filter(
      (child: any) =>
        React.isValidElement(child) &&
        (child as any).type === 'script' &&
        typeof (child as any).props?.src === 'string'
    )
    .map((child: any) => (child as any).props.src)

beforeEach(() => {
  lastRenderedProps = null
})

afterEach(() => {
  cleanup()
})

it('forwards a single script src through unchanged', () => {
  const Helmet = loadHelmet()

  render(<Helmet script={[{ src: 'https://example.com/a.js' }]} />)

  expect(renderedScriptSrcs()).toEqual(['https://example.com/a.js'])
})

it('drops duplicate script srcs passed via the `script` prop', () => {
  const Helmet = loadHelmet()

  render(
    <Helmet
      script={[
        { src: 'https://example.com/a.js' },
        { src: 'https://example.com/a.js' },
        { src: 'https://example.com/b.js' },
      ]}
    />
  )

  expect(renderedScriptSrcs()).toEqual([
    'https://example.com/a.js',
    'https://example.com/b.js',
  ])
})

it('drops duplicate script srcs passed as JSX children', () => {
  const Helmet = loadHelmet()

  render(
    <Helmet>
      <script src="https://example.com/a.js" />
      <script src="https://example.com/a.js" />
      <script src="https://example.com/b.js" />
    </Helmet>
  )

  expect(renderedChildScriptSrcs()).toEqual([
    'https://example.com/a.js',
    'https://example.com/b.js',
  ])
})

it('dedupes a script src across the `script` prop and JSX children of the same instance', () => {
  const Helmet = loadHelmet()

  render(
    <Helmet script={[{ src: 'https://example.com/a.js' }]}>
      <script src="https://example.com/a.js" />
    </Helmet>
  )

  // The `script` prop is processed first, so it wins; the duplicate from
  // children is dropped.
  expect(renderedScriptSrcs()).toEqual(['https://example.com/a.js'])
  expect(renderedChildScriptSrcs()).toEqual([])
})

it('drops duplicates across independently-mounted instances', () => {
  const Helmet = loadHelmet()

  render(<Helmet script={[{ src: 'https://example.com/a.js' }]} />)

  expect(renderedScriptSrcs()).toEqual(['https://example.com/a.js'])

  cleanup()

  // A second, independent mount (e.g. another instance of the same
  // widget elsewhere on the page) requesting the exact same src should
  // have it dropped, because the module-scoped registry remembers it was
  // already requested.
  render(<Helmet script={[{ src: 'https://example.com/a.js' }]} />)

  expect(renderedScriptSrcs()).toEqual([])
})

it('does not dedupe scripts without a src (inline scripts)', () => {
  const Helmet = loadHelmet()

  render(
    <Helmet
      script={[{ innerHTML: 'window.a = 1' }, { innerHTML: 'window.a = 1' }]}
    />
  )

  expect(lastRenderedProps.script).toEqual([
    { innerHTML: 'window.a = 1' },
    { innerHTML: 'window.a = 1' },
  ])
})

it('leaves non-script children and other props untouched', () => {
  const Helmet = loadHelmet()

  render(
    <Helmet title="my title">
      <meta name="description" content="desc" />
    </Helmet>
  )

  expect(lastRenderedProps.title).toBe('my title')
  expect(React.Children.toArray(lastRenderedProps.children)).toHaveLength(1)
})

it('starts each fresh module instance with an empty registry', () => {
  const FirstHelmet = loadHelmet()

  render(<FirstHelmet script={[{ src: 'https://example.com/a.js' }]} />)
  expect(renderedScriptSrcs()).toEqual(['https://example.com/a.js'])
  cleanup()

  // Sanity check for the test helper itself: a fresh module (as if the
  // page had reloaded) must not remember the previous instance's src.
  const SecondHelmet = loadHelmet()

  render(<SecondHelmet script={[{ src: 'https://example.com/a.js' }]} />)
  expect(renderedScriptSrcs()).toEqual(['https://example.com/a.js'])
})

// NOTE: using plain (non-`import type`) imports for the type-only names
// below (`ReactNode`, `HelmetProps`) is intentional -- the project's
// installed `babel-preset-react-app` (7.0.2) doesn't support the
// `import type { ... }` syntax and jest fails to parse it.
import React, { Children, isValidElement, ReactNode } from 'react'
import { Helmet as ReactHelmet, HelmetProps } from 'react-helmet'

/**
 * `<script src>` tags are idempotent for the lifetime of a single page
 * load: once a given URL has been requested, its side effects (e.g. a
 * global like `window.grecaptcha`) persist for as long as the page is
 * open, so there's never a reason to request the exact same `src` a
 * second time on the client -- even if the component that first
 * requested it later unmounts, or a different, unrelated component
 * requests it again.
 *
 * In practice, multiple independently-mounted components (e.g. several
 * instances of the same provider/widget on one page) can each declare
 * `<Helmet><script src="..." /></Helmet>` for the same external script.
 * `react-helmet` has no built-in de-duplication for `<script>` tags (only
 * `title`/`base` are singletons, and `meta`/`link` dedupe by specific
 * attributes) -- it just concatenates every mounted `<Helmet>` instance's
 * tags, so each duplicate becomes its own real network request.
 *
 * This wrapper drops exact-duplicate `<script src>` entries (from either
 * the `script` prop or JSX children) before they ever reach `react-helmet`,
 * so only the first request for a given URL is ever rendered into the DOM.
 * It also adopts the scripts `react-helmet` already emitted server-side, so
 * hydration can't re-request them -- see `adoptServerRenderedScripts` below.
 *
 * This is intentionally client-only. Registering "already requested"
 * state at module scope would leak across unrelated requests during
 * server-side rendering (a long-lived Node process renders many
 * different users' pages), so SSR output is left completely untouched --
 * only the client, which gets a fresh JS context on every page load, gets
 * de-duplication.
 *
 * NOTE on how "client-only" is detected: `react-helmet`'s own exported
 * `Helmet.canUseDOM` static is, in the installed version, a *write-only*
 * accessor (it only has a `set`, used so tests can force server-mode
 * rendering under jsdom) -- reading it back always yields `undefined`,
 * never a real boolean. Relying on `ReactHelmet.canUseDOM` as a read
 * would therefore make this de-duplication a permanent no-op on every
 * environment, including the client, which would silently defeat the
 * whole point of this change. Instead we replicate, inline, the exact
 * same environment check that `react-helmet` (via `react-side-effect`
 * and `exenv`) uses *internally* to seed that same flag in the first
 * place: `typeof window !== 'undefined' && window.document &&
 * window.document.createElement`. This is computed once, at module
 * load, exactly like the flag it mirrors.
 */
const isClient = !!(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
)

const requestedScriptSrcs: Set<string> | null = isClient ? new Set() : null

/**
 * Adopts the `<script src>` tags that `react-helmet` already emitted into
 * the server-rendered HTML, so the client never re-requests them.
 *
 * This handles a duplication that the in-render de-duplication above
 * cannot see, because the two copies never coexist in a single render
 * pass -- they're separated in *time*:
 *
 *  1. The server renders `<script src="...">` into `<head>`. The browser
 *     requests and executes it while parsing the document.
 *  2. On the first client commit, the component that declared that script
 *     may not have mounted yet (it commonly lives behind a lazily-loaded
 *     chunk). `react-helmet` therefore sees a tag of its own in the DOM
 *     that nothing in the current tree claims, and removes it.
 *  3. A commit later the component mounts, `react-helmet` no longer finds
 *     the tag it just removed, and appends a brand-new -- byte-identical
 *     -- one. A freshly inserted `<script>` element *always* executes, so
 *     the external script runs a second time.
 *
 * A script running twice is not just a wasted request (the second one is
 * usually served from cache anyway): it's a second full parse/execute of
 * the payload, and for anything that registers global state on load it
 * also means a duplicated instance. reCAPTCHA is the pathological case --
 * every extra execution of its loader registers another widget, each of
 * which pulls its own ~340 KiB of Google-internal code and keeps polling
 * the main thread for the rest of the page's life.
 *
 * Because the registry lives at module scope, seeding it here (before
 * `react-helmet` has had a chance to run its first DOM sync) is enough to
 * make step 3 a no-op: by the time the component finally mounts, its
 * `src` is already known to have been requested, so it never reaches
 * `react-helmet` and no new tag is ever created.
 *
 * We also drop `data-react-helmet` from the adopted tags. That attribute
 * is how `react-helmet` recognizes the tags it owns, so removing it makes
 * it ignore them entirely -- meaning step 2 doesn't happen either and the
 * tag simply stays in the DOM exactly where the server put it, instead of
 * being removed and never restored.
 *
 * Note this runs at module load, which on the client happens while the
 * runtime bundle evaluates -- the bundle's `<script>` tags sit at the end
 * of `<body>`, so the whole `<head>` (and with it every server-rendered
 * `react-helmet` tag) is already parsed and present by then.
 */
function adoptServerRenderedScripts() {
  if (!requestedScriptSrcs) {
    return
  }

  const serverRendered = document.querySelectorAll(
    'script[data-react-helmet][src]'
  )

  for (let i = 0; i < serverRendered.length; i++) {
    const script = serverRendered[i]
    // The raw attribute (rather than the resolved `.src` property) is what
    // we want here: it's the same string the app authored, which is what
    // the incoming props will be compared against.
    const src = script.getAttribute('src')

    if (src) {
      requestedScriptSrcs.add(src)
      script.removeAttribute('data-react-helmet')
    }
  }
}

adoptServerRenderedScripts()

function hasSrc(value: unknown): value is { src: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { src?: unknown }).src === 'string'
  )
}

function shouldKeepSrc(src: string): boolean {
  if (!requestedScriptSrcs) {
    return true
  }

  if (requestedScriptSrcs.has(src)) {
    return false
  }

  requestedScriptSrcs.add(src)

  return true
}

function dedupeScriptArray(
  scripts: HelmetProps['script']
): HelmetProps['script'] {
  if (!scripts || !requestedScriptSrcs) {
    return scripts
  }

  return scripts.filter(
    (script) => !hasSrc(script) || shouldKeepSrc(script.src)
  )
}

function dedupeScriptChildren(children: ReactNode): ReactNode {
  if (!requestedScriptSrcs) {
    return children
  }

  return Children.map(children, (child) => {
    if (
      !isValidElement(child) ||
      child.type !== 'script' ||
      !hasSrc(child.props)
    ) {
      return child
    }

    return shouldKeepSrc(child.props.src) ? child : null
  })
}

type Props = React.PropsWithChildren<HelmetProps>

const Helmet = ({ children, script, ...rest }: Props) => (
  <ReactHelmet {...rest} script={dedupeScriptArray(script)}>
    {dedupeScriptChildren(children)}
  </ReactHelmet>
)

Helmet.peek = ReactHelmet.peek
Helmet.rewind = ReactHelmet.rewind
Helmet.renderStatic = ReactHelmet.renderStatic
Helmet.canUseDOM = ReactHelmet.canUseDOM

export default Helmet

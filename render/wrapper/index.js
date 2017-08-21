const webpackAssetsPath = (app) => `if (__RUNTIME__.account && __RUNTIME__.workspace) {
  __webpack_public_path__ = '//' + __RUNTIME__.workspace + '--' + __RUNTIME__.account + '.myvtex.com/resources/smartcheckout/${app}/dist/'
}`

const dep = 'function dep (m) { return m.default || m }'

const isBrowser = 'typeof window !== \'undefined\' && window.document'

const global = `if (${isBrowser} && !window.global) { window.global = window }`

const hot = app =>
`if (${isBrowser} && module.hot) {
  require('${require.resolve('react-hot-loader/patch')}');
  require('${require.resolve('eventsource-polyfill')}');
  require('${require.resolve('webpack/hot/dev-server')}');
  var hotEmitter = require('${require.resolve('webpack/hot/emitter')}');
  var myvtexSSE = require('${require.resolve('myvtex-sse')}');
  var account = __RUNTIME__.account;
  var workspace = __RUNTIME__.workspace;
  var ssePath = 'vtex.render-builder:${app}:browser';
  __RUNTIME__.sseAdded = __RUNTIME__.sseAdded || {}
  if (!__RUNTIME__.sseAdded['${app}']) {
    myvtexSSE(account, workspace, ssePath, {verbose: true}, function(event) {
      switch (event.body.type) {
        case 'hmr':
          console.log('[HMR]: App (${app}) hot update ', event.body.hash);
          hotEmitter.emit('webpackHotUpdate', event.body.hash);
          window.postMessage('webpackHotUpdate' + event.body.hash, '*');
          break;
        case 'reload':
          console.log('[HMR]: App (${app}) reload');
          location.reload(true);
          break;
        case 'locales':
          console.log('[HMR]: App (${app}) locale update', event.body.locales);
          window.postMessage(event, '*');
          break;
      }
    });
    __RUNTIME__.sseAdded['${app}'] = true
  }
}`

const req = module => module && `dep(require('${module}'));`

const registerComponent = ({component, name}) =>
  component ? `__RUNTIME__.placeholders['${name}'].Component = ${req(component)};` : ''

const emitComponentUpdate = ({component, name}) => component ? `__RUNTIME__.eventEmitter.emit('placeholder:${name}:update');` : ''

const hotAccept = ({component, name}) =>
  component ? `if (module.hot) { module.hot.accept('${component}', function () {
  ${registerComponent({component, name})}
  ${emitComponentUpdate({component, name})}
})}` : ''

const render = (placeholder) =>
`if (!__RUNTIME__.initialBrowserRender) {
  var runtime = ${req('vtex.render-runtime')};
  runtime('${placeholder.name}');
  __RUNTIME__.initialBrowserRender = ${isBrowser};
}`

const ES6Requires =
`${[
  'core-js/fn/object/values',
  'core-js/fn/object/assign',
  'core-js/fn/array/find-index',
  'core-js/fn/array/fill.js',
  'core-js/fn/array/find.js',
  'core-js/fn/string/starts-with.js',
  'core-js/es6/symbol.js',
  'whatwg-fetch',
].map(require.resolve).map(req).join('\n')}`

module.exports.createPageEntrypoint = function createPageEntrypoint (app, placeholder, production) {
  return `${ES6Requires}
  ${module.exports.createComponentEntrypoint(app, placeholder, production)}
var EventEmitter = ${req('events')};
__RUNTIME__.eventEmitter = new EventEmitter();
if (module.hot) { module.hot.accept('vtex.render-runtime', function () {
  runtime = ${req('vtex.render-runtime')}
  runtime('${placeholder.name}')
})}
${render(placeholder)}`
}

module.exports.createComponentEntrypoint = function createComponentEntrypoint (app, placeholder, production) {
  return `${dep};
${global};
${webpackAssetsPath(app)};
${placeholder.theme ? req(placeholder.theme) : ''}
${registerComponent(placeholder)};
${!production ? hot(app) : ''}
${hotAccept(placeholder)}`
}

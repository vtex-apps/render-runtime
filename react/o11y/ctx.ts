import { AdminTags } from './types'

interface RuntimeInfo {
  account: string | null
  workspace: string | null
  route: { path: string | null; blockId: string | null }
  culture: { locale: string | null }
  production: boolean | null
  loadedDevices: Array<string | null>
}

/**
 * Infer the runtime information from the window.location object.
 */
export function inferRuntimeInfo(): Partial<RuntimeInfo> {
  const { host = '' } = window.location
  let account = ''
  let workspace = ''

  if (!host.includes('--')) {
    account = host.split('.')[0]
    workspace = 'master'
  } else {
    workspace = host.split('--')[0]
    account = host.split('--')[1].split('.')[0]
  }

  const { pathname } = window.location

  const locale =
    navigator?.language ?? Intl.DateTimeFormat().resolvedOptions().locale

  return {
    account,
    workspace,
    route: { path: pathname, blockId: null },
    culture: { locale },
  }
}

/**
 * Gets the Runtime information from the global __RUNTIME__ object
 * injected by Render Server, if available, otherwise infer the runtime
 * information from the window.location.
 */
export function getRuntimeInfo(): RuntimeInfo & { runtimeAvailable: boolean } {
  const runtime = window?.__RUNTIME__ ?? inferRuntimeInfo()

  const {
    account = null,
    workspace = null,
    culture: { locale } = { locale: null },
    route: { path, blockId } = { path: null, blockId: null },
    loadedDevices = null,
    production = null,
  } = runtime

  return {
    account,
    workspace,
    culture: { locale },
    route: { path, blockId },
    loadedDevices,
    production,
    runtimeAvailable: !!window?.__RUNTIME__,
  }
}

/**
 * Retrieves VTEX IO context and adapt it to format expected
 * by Sentry for the Admin.
 */
export function getIOContext(): AdminTags {
  const runtime = window?.__RUNTIME__ ?? inferRuntimeInfo()

  const {
    account = null,
    workspace = null,
    culture: { locale } = { locale: null },
    route: { path, blockId } = { path: null, blockId: null },
    loadedDevices = null,
    production = null,
  } = runtime

  return {
    admin_account: account,
    admin_workspace: workspace,
    admin_locale: locale,
    admin_path: path,
    admin_app_block: blockId, // ex. "vtex.admin-home@3.x:admin.app.home"
    admin_device: Array.isArray(loadedDevices)
      ? loadedDevices[0]
      : loadedDevices,
    admin_production: production,
    admin_runtime_available: !!window?.__RUNTIME__,
  }
}

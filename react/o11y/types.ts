/**
 * Custom Admin tags logged by the Sentry SDK.
 */
export type CustomAdminTags = Record<string, any> & {
  /**
   * The Render Runtime page component that rendered an error.
   */
  admin_render_runtime_page: 'ErrorPage' | 'ErrorBoundary'
}

/**
 * Default Admin tags logged by the Sentry SDK.
 */
export interface AdminTags {
  /**
   * Account running the app.
   */
  admin_account: string
  /**
   * Workspace running the app.
   */
  admin_workspace: string
  /**
   * Locale running the app.
   */
  admin_locale: string
  /**
   * Path of the app.
   */
  admin_path: string
  /**
   * Block ID of the app.
   *
   * @example
   * "vtex.admin-home@3.x:admin.app.home"
   */
  admin_app_block: string
  /**
   * Device running the app.
   *
   * @example
   * ["desktop", "tablet"]
   */
  admin_device: string
  /**
   * Whether the app is running in production.
   * The values from this variable logged to
   * Sentry are always true OR null; never false.
   */
  admin_production: boolean
  /**
   * Whether the runtime information from the
   * global __RUNTIME__ object is available or not.
   */
  admin_runtime_available: boolean
}

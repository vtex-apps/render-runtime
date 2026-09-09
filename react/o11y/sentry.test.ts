jest.mock('../utils/isAdmin')
jest.mock('./ctx')

const mockInit = jest.fn()
const mockCaptureException = jest.fn()
const mockReplayIntegration = jest.fn(() => ({}))

// Controls whether the mocked dynamic import of '@sentry/react' rejects
// (simulating a ChunkLoadError) or resolves. Must be prefixed with "mock"
// so babel-plugin-jest-hoist allows referencing it from the jest.mock
// factory below.
let mockShouldFailImport = false

jest.mock('@sentry/react', () => {
  if (mockShouldFailImport) {
    throw new Error('ChunkLoadError: Loading chunk sentry failed.')
  }

  return {
    init: mockInit,
    captureException: mockCaptureException,
    replayIntegration: mockReplayIntegration,
  }
})

/**
 * `./sentry` keeps module-scoped singleton state (the cached import promise
 * and the "initialized" flag), which is exactly the state under test here
 * (the reject/retry behavior). So each test gets a fully fresh module
 * registry via `jest.resetModules()`, and re-requires everything (including
 * the mocked `isAdmin`/`ctx`) *after* resetting, instead of importing them
 * once at the top of the file — otherwise the `isAdmin`/`ctx` references
 * held by the test would become stale copies, decoupled from the ones
 * `./sentry` actually calls after the reset.
 */
function setup({ isAdmin }: { isAdmin: boolean }) {
  jest.resetModules()
  mockShouldFailImport = false
  mockInit.mockClear()
  mockCaptureException.mockClear()

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { isAdmin: mockIsAdmin } = require('../utils/isAdmin')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getIOContext: mockGetIOContext } = require('./ctx')

  mockIsAdmin.mockReturnValue(isAdmin)
  mockGetIOContext.mockReturnValue({ admin_production: true })

  return require('./sentry')
}

describe('sentry', () => {
  test('captureException no-ops outside admin and never loads the SDK', async () => {
    const { captureException } = setup({ isAdmin: false })

    const result = await captureException(new Error('boom'))

    expect(result).toBeUndefined()
    expect(mockInit).not.toHaveBeenCalled()
    expect(mockCaptureException).not.toHaveBeenCalled()
  })

  test('captureException lazily loads and initializes Sentry once, then reports', async () => {
    const { captureException } = setup({ isAdmin: true })

    await captureException(new Error('first'))
    await captureException(new Error('second'))

    expect(mockInit).toHaveBeenCalledTimes(1)
    expect(mockCaptureException).toHaveBeenCalledTimes(2)
    expect(mockCaptureException).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ message: 'first' }),
      undefined
    )
  })

  test('a chunk-load failure never throws/rejects back at the caller (fire-and-forget safe)', async () => {
    const { captureException } = setup({ isAdmin: true })

    mockShouldFailImport = true

    await expect(captureException(new Error('boom'))).resolves.toBeUndefined()
    expect(mockCaptureException).not.toHaveBeenCalled()
  })

  test('after a chunk-load failure, a later call retries instead of reusing the dead promise', async () => {
    const { captureException } = setup({ isAdmin: true })

    // First call fails to load the chunk.
    mockShouldFailImport = true
    await captureException(new Error('boom'))
    expect(mockCaptureException).not.toHaveBeenCalled()

    // The chunk becomes available (e.g. network recovers) — a later call
    // must not keep reusing the rejected promise from the failed attempt.
    mockShouldFailImport = false
    await captureException(new Error('recovered'))

    expect(mockInit).toHaveBeenCalledTimes(1)
    expect(mockCaptureException).toHaveBeenCalledTimes(1)
    expect(mockCaptureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'recovered' }),
      undefined
    )
  })

  test('initSentry no-ops outside admin', async () => {
    const { initSentry } = setup({ isAdmin: false })

    await initSentry()

    expect(mockInit).not.toHaveBeenCalled()
  })

  test('initSentry loads and initializes Sentry when in admin', async () => {
    const { initSentry } = setup({ isAdmin: true })

    await initSentry()

    expect(mockInit).toHaveBeenCalledTimes(1)
  })

  test('a failure in initSentry is swallowed, never rejects, and a later call can retry', async () => {
    const { initSentry } = setup({ isAdmin: true })

    mockShouldFailImport = true
    await expect(initSentry()).resolves.toBeUndefined()
    expect(mockInit).not.toHaveBeenCalled()

    mockShouldFailImport = false
    await initSentry()
    expect(mockInit).toHaveBeenCalledTimes(1)
  })
})

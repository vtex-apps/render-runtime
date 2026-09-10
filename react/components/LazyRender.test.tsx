import React from 'react'
import { act, cleanup, render, wait } from '@vtex/test-tools/react'
import 'jest-dom/extend-expect'

import LazyRender from './LazyRender'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Fires an IntersectionObserver callback simulating the element coming into view.
 * Always uses the most recently created observer instance.
 */
const triggerIntersection = (isIntersecting: boolean) => {
  const instances = (window.IntersectionObserver as any).mock.instances
  const calls = (window.IntersectionObserver as any).mock.calls
  const lastIndex = instances.length - 1
  const observer = instances[lastIndex]
  const callback = calls[lastIndex][0]
  callback(
    [{ isIntersecting, intersectionRatio: isIntersecting ? 1 : 0 }],
    observer
  )
}

/** Dispatches the asyncScriptsReady custom event on window. */
const dispatchAsyncScriptsReady = () => {
  window.__ASYNC_SCRIPTS_READY__ = true
  window.dispatchEvent(new CustomEvent('asyncScriptsReady'))
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockObserve = jest.fn()
const mockUnobserve = jest.fn()
const mockDisconnect = jest.fn()

const IntersectionObserverMock = jest.fn().mockImplementation((cb) => ({
  observe: mockObserve,
  unobserve: mockUnobserve,
  disconnect: mockDisconnect,
  _cb: cb,
}))

beforeAll(() => {
  ;(window as any).IntersectionObserver = IntersectionObserverMock
  // Simulate scroll > 0 so initializeOnInteraction triggers immediately
  Object.defineProperty(window, 'scrollY', { writable: true, value: 100 })
})

afterEach(() => {
  cleanup()
  jest.clearAllMocks()
  delete (window as any).__ASYNC_SCRIPTS_READY__
  // Reset scrollY
  ;(window as any).scrollY = 100
})

// ---------------------------------------------------------------------------
// Tests: async mode OFF (__ASYNC_SCRIPTS_READY__ === undefined)
// ---------------------------------------------------------------------------

describe('when async scripts mode is OFF (__ASYNC_SCRIPTS_READY__ is undefined)', () => {
  beforeEach(() => {
    // Simulate a store without enableAsyncScripts: the global is never set
    delete (window as any).__ASYNC_SCRIPTS_READY__
  })

  it('registers the IntersectionObserver immediately (no waiting)', () => {
    render(
      <LazyRender>
        <div data-testid="child">content</div>
      </LazyRender>
    )

    expect(mockObserve).toHaveBeenCalledTimes(1)
  })

  it('renders children once the element enters the viewport', () => {
    const { queryByTestId } = render(
      <LazyRender>
        <div data-testid="child">content</div>
      </LazyRender>
    )

    expect(queryByTestId('child')).toBeNull()

    act(() => {
      triggerIntersection(true)
    })

    expect(queryByTestId('child')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Tests: async mode ON, bundles already done (__ASYNC_SCRIPTS_READY__ === true)
// ---------------------------------------------------------------------------

describe('when async scripts mode is ON and all bundles already ran', () => {
  beforeEach(() => {
    ;(window as any).__ASYNC_SCRIPTS_READY__ = true
  })

  it('registers the IntersectionObserver immediately (no waiting needed)', () => {
    render(
      <LazyRender>
        <div data-testid="child">content</div>
      </LazyRender>
    )

    expect(mockObserve).toHaveBeenCalledTimes(1)
  })

  it('renders children once the element enters the viewport', () => {
    const { queryByTestId } = render(
      <LazyRender>
        <div data-testid="child">content</div>
      </LazyRender>
    )

    expect(queryByTestId('child')).toBeNull()

    act(() => {
      triggerIntersection(true)
    })

    expect(queryByTestId('child')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Tests: async mode ON, bundles still pending (__ASYNC_SCRIPTS_READY__ === false)
// ---------------------------------------------------------------------------

describe('when async scripts mode is ON and bundles are still pending', () => {
  beforeEach(() => {
    ;(window as any).__ASYNC_SCRIPTS_READY__ = false
  })

  it('does NOT register the IntersectionObserver while bundles are pending', () => {
    render(
      <LazyRender>
        <div data-testid="child">content</div>
      </LazyRender>
    )

    expect(mockObserve).not.toHaveBeenCalled()
  })

  it('does NOT render children even if intersection fires while bundles are pending', () => {
    const { queryByTestId } = render(
      <LazyRender>
        <div data-testid="child">content</div>
      </LazyRender>
    )

    // No observer registered, so intersection cannot fire — children stay hidden
    expect(mockObserve).not.toHaveBeenCalled()
    expect(queryByTestId('child')).toBeNull()
  })

  it('registers the IntersectionObserver after asyncScriptsReady fires', async () => {
    render(
      <LazyRender>
        <div data-testid="child">content</div>
      </LazyRender>
    )

    expect(mockObserve).not.toHaveBeenCalled()

    act(() => {
      dispatchAsyncScriptsReady()
    })

    // wait() polls until the assertion passes, handling deferred React effects
    // triggered by native DOM events that act() may not flush synchronously.
    await wait(() => expect(mockObserve).toHaveBeenCalledTimes(1))
  })

  it('renders children after asyncScriptsReady fires AND element enters viewport', async () => {
    const { queryByTestId } = render(
      <LazyRender>
        <div data-testid="child">content</div>
      </LazyRender>
    )

    expect(queryByTestId('child')).toBeNull()

    // Step 1: bundles finish — observer registered once effects flush
    act(() => {
      dispatchAsyncScriptsReady()
    })
    await wait(() => expect(mockObserve).toHaveBeenCalledTimes(1))

    expect(queryByTestId('child')).toBeNull()

    // Step 2: element enters viewport
    act(() => {
      triggerIntersection(true)
    })

    expect(queryByTestId('child')).toBeInTheDocument()
  })

  it('does not crash if asyncScriptsReady fires multiple times', async () => {
    const { queryByTestId } = render(
      <LazyRender>
        <div data-testid="child">content</div>
      </LazyRender>
    )

    // First event: sets asyncReady=true, listener then removed by cleanup
    act(() => {
      dispatchAsyncScriptsReady()
    })
    await wait(() => expect(mockObserve).toHaveBeenCalledTimes(1))

    // Second event: listener is already gone, no new observer is created
    act(() => {
      dispatchAsyncScriptsReady()
    })

    act(() => {
      triggerIntersection(true)
    })

    expect(queryByTestId('child')).toBeInTheDocument()
    // Observer registered exactly once despite multiple events
    expect(mockObserve).toHaveBeenCalledTimes(1)
  })

  it('cleans up the asyncScriptsReady listener on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

    const { unmount } = render(
      <LazyRender>
        <div>content</div>
      </LazyRender>
    )

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'asyncScriptsReady',
      expect.any(Function)
    )

    removeEventListenerSpy.mockRestore()
  })
})

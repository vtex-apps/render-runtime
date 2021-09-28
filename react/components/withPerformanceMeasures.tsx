import React, {
  useEffect,
  useState,
  ComponentType,
  FunctionComponent,
} from 'react'
import { Device, DeviceInfo } from '../utils/withDevice'

import { RenderRuntime } from '../typings/runtime'

import SplunkEvents from 'splunk-events'

const SPLUNK_ENDPOINT = 'https://splunk72-heavyforwarder-public.vtex.com:8088'
const SPLUNK_TOKEN = 'cce4a8e7-6e7a-40a0-aafb-ac45b0e271ba'

const splunkLogger = new SplunkEvents()

splunkLogger.config({
  endpoint: SPLUNK_ENDPOINT,
  token: SPLUNK_TOKEN,
  source: 'log',
})

const { logEvent } = splunkLogger

const MEASURES = [
  {
    name: 'from-start-to-first-render',
    start: undefined,
    end: 'hydration',
  },
  {
    name: 'intl-polyfill',
    start: 'intl-polyfill-start',
    end: 'intl-polyfill-end',
  },
  {
    name: 'uncritical-styles',
    start: 'uncritical-styles-start',
    end: 'uncritical-styles-end',
  },
  {
    name: 'content-loaded',
    start: undefined,
    end: 'content-loaded-promise-resolved',
  },
  {
    name: 'from-init-inline-js-to-first-render',
    start: 'init-inline-js',
    end: 'hydration',
  },
  {
    name: 'from-script-start-to-first-render',
    start: 'init-runScript',
    end: 'hydration',
  },
  {
    name: 'script-init',
    start: 'init-runScript',
    end: 'asyncScriptsReady-fired',
  },
  {
    name: 'render-start-interval',
    start: 'asyncScriptsReady-fired',
    end: 'render-start',
  },
  {
    name: 'first-render',
    start: 'render-start',
    end: 'hydration',
  },
]

/** performance.measure throws an error if the markers don't exist.
 * This function makes its usage more ergonomic.
 */
function performanceMeasure(
  ...args: Parameters<typeof window.performance.measure>
): PerformanceMeasure | null | undefined | void {
  try {
    const measure = window?.performance?.measure?.(...args)
    if (measure as PerformanceMeasure | undefined) {
      return measure
    }
    // Fix for Firefox. Performance.measure doesn't return anything it seems,
    // but you can still get it via getEntriesByName and the like.
    const [name] = args ?? []
    if (typeof name !== 'string') {
      return null
    }
    const entriesByName = window?.performance?.getEntriesByName?.(name)
    const [firstEntry] = entriesByName ?? []
    if (!isPerformanceMeasure(firstEntry)) {
      return null
    }
    return firstEntry
  } catch (e) {
    return null
  }
}

function isPerformanceMeasure(value: any): value is PerformanceMeasure {
  return value?.entryType === 'measure'
}

function shouldLogPerformanceMeasures({
  account,
  page,
  domain,
}: {
  account?: string
  page?: string
  domain?: string
}) {
  if (!account) {
    return
  }
  if (domain !== 'store') {
    return
  }
  const shouldDebugLogMeasures = window?.location?.search?.includes?.(
    '__debugLogMeasures'
  )
  if (shouldDebugLogMeasures) {
    return true
  }

  const DEFAULT_LOG_SAMPLING_RATE = 0.0075
  // Allows increasing the log rate of certain accounts and pages for closer analysis.
  const HIGHLIGHT_LOG_SAMPLING_RATE = 0.04
  const HIGHLIGHT_ACCOUNTS = ['carrefourbr']
  const HIGHLIGHT_PAGES = ['store.home']

  const shouldIncreaseLogRate =
    HIGHLIGHT_ACCOUNTS.includes(account) &&
    page &&
    HIGHLIGHT_PAGES.includes(page)

  const logRate = shouldIncreaseLogRate
    ? HIGHLIGHT_LOG_SAMPLING_RATE
    : DEFAULT_LOG_SAMPLING_RATE

  return Math.random() <= logRate
}

function logPerformanceMeasures({
  measures,
  account,
  device,
  page,
  domain,
}: {
  measures: ReturnType<typeof performanceMeasure>[]
  account?: string
  device?: Device
  page?: string
  domain?: string
}) {
  if (!shouldLogPerformanceMeasures({ account, page, domain })) {
    return
  }

  const measuresData: Record<string, number> = {}

  let hasValidMeasures = false
  for (const measure of measures) {
    if (!measure) {
      continue
    }
    // Some measures might be invalid because some performance marks might not be
    // registered depending on the page configuration (for example, there's a mark
    // for measuring async script loading, but the page might be loading scripts
    // synchronously and so the mark won't be set).
    // Also browsers might not have the performance mark/measure feature.
    hasValidMeasures = true
    if (measure.startTime > 0) {
      measuresData[`${measure.name}-start`] = measure.startTime
    }
    measuresData[`${measure.name}-duration`] = measure.duration
  }

  if (!hasValidMeasures) {
    return
  }

  const data = {
    ...measuresData,
    device: device ?? 'unknown',
    page: page ?? 'unknown',
  }

  logEvent('Debug', 'Info', 'render', 'render-performance', data, account)
}

type Props = {
  runtime: RenderRuntime
  deviceInfo: DeviceInfo
}

const withPerformanceMeasures = <P extends Props>(
  Component: ComponentType<P>
) => {
  // There seems to be a weird issue around the type of React.memo that happens
  // during build, but not locally. The type of `P` ends up mismatching the
  // type of `...props` below, even though both are `P`.
  // I suspect it might be due to some issue on the specific @types/react version.
  // Anyway, converting the type to FunctionComponent<P> fixes the issue for now.
  const MemoizedComponent = (React.memo(
    Component
  ) as unknown) as FunctionComponent<P>

  const WithPerformanceMeasures = ({ ...props }: P) => {
    const [hasHydrated, setHasHydrated] = useState(false)

    useEffect(() => {
      if (!hasHydrated) {
        setHasHydrated(true)
      }
    }, [setHasHydrated, hasHydrated])

    if (hasHydrated) {
      // Using setTimeout to force the execution of this function slightly after
      // the entire first post-render task (i.e. after all the useEffects etc).
      setTimeout(() => {
        performance.mark('hydration')

        const measures = MEASURES.map(({ name, start, end }) =>
          performanceMeasure(name, start, end)
        )

        logPerformanceMeasures({
          measures,
          account: props?.runtime?.account,
          device: props?.deviceInfo?.type,
          page: props?.runtime?.page,
          domain: props?.runtime?.route?.domain,
        })
      }, 1)
    }

    return <MemoizedComponent {...(props as P)} />
  }

  return WithPerformanceMeasures
}

export { withPerformanceMeasures }

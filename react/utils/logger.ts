const KIBANA_NAMESPACE = 'renderruntime'
const KIBANA_VALUE = 1

const logEvent = (event: LogEvent) => {
  // defaultData contains remaining fields required by sendMetric
  const defaultData = {
    namespace: KIBANA_NAMESPACE,
    value: KIBANA_VALUE
  }
  const formattedEvent = Object.assign(defaultData, event)

  if (vtex.NavigationCapture && vtex.NavigationCapture.sendMetric) {
    vtex.NavigationCapture.sendMetric(formattedEvent)
  }
}

export default logEvent

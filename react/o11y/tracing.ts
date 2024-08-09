import { Span, SpanStatusCode } from '@opentelemetry/api'
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web'
import { Resource } from '@opentelemetry/resources'
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { ZoneContextManager } from '@opentelemetry/context-zone'
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch'
import { FetchError } from '@opentelemetry/instrumentation-fetch/build/src/types'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { isAdmin } from '../utils/isAdmin'

declare const window: any

if (isAdmin()) {
  const serviceName = 'vtex.render-runtime'

  const resource = new Resource({ 'service.name': serviceName })
  const provider = new WebTracerProvider({ resource })

  const collector = new OTLPTraceExporter({
    url: 'http://localhost:4318/v1/traces',
    // headers: {
    //   "signoz-access-token": "SigNoz-Cloud-Ingestion-Token-HERE"
    // }
  })

  provider.addSpanProcessor(new SimpleSpanProcessor(collector))
  provider.register({ contextManager: new ZoneContextManager() })

  const webTracerWithZone = provider.getTracer(serviceName)

  let bindingSpan: Span | undefined

  window.startBindingSpan = (
    traceId: string,
    spanId: string,
    traceFlags: number
  ) => {
    bindingSpan = webTracerWithZone.startSpan('')
    bindingSpan.spanContext().traceId = traceId
    bindingSpan.spanContext().spanId = spanId
    bindingSpan.spanContext().traceFlags = traceFlags
  }

  registerInstrumentations({
    instrumentations: [
      new FetchInstrumentation({
        propagateTraceHeaderCorsUrls: ['/.*/g'],
        clearTimingResources: true,
        applyCustomAttributesOnSpan: (
          span: Span,
          _: Request | RequestInit,
          result: Response | FetchError
        ) => {
          const attributes = (span as any).attributes
          if (attributes.component === 'fetch') {
            span.updateName(
              `${attributes['http.method']} ${attributes['http.url']}`
            )
          }
          if (result instanceof Error) {
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: result.message,
            })
            span.recordException(result.stack || result.name)
          }
        },
      }),
    ],
  })
}

// Example taken and adapted from https://github.com/honeycombio/honeycomb-opentelemetry-web/blob/main/examples/custom-with-collector-ts/src/index.ts
import { HoneycombWebSDK as BetterOpenTelemetryWebSDK } from '@honeycombio/opentelemetry-web'
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web'
import { vendor, name, version } from '../manifest.json'

export function startTracing() {
  const configDefaults = {
    ignoreNetworkEvents: true,
  }

  const sdk = new BetterOpenTelemetryWebSDK({
    // To send direct to Honeycomb, set API Key and comment out endpoint
    // apiKey: 'api-key',
    endpoint: 'https://http-collector-beta.vtex.systems',
    serviceName: `${vendor}.${name}@${version}`,
    debug: true,
    skipOptionsValidation: true,
    resourceAttributes: { 'app.environment': 'development' },
    instrumentations: [
      // add auto-instrumentation
      getWebAutoInstrumentations({
        '@opentelemetry/instrumentation-xml-http-request': configDefaults,
        '@opentelemetry/instrumentation-fetch': configDefaults,
        '@opentelemetry/instrumentation-document-load': configDefaults,
      }),
    ],
  })
  sdk.start()
}

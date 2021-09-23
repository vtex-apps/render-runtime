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

export { logEvent }

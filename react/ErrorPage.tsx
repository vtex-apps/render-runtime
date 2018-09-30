import React, {Component} from 'react'

const toSplunkLink = (rid: string) =>
  `https://splunk7.vtex.com/en-US/app/vtex_colossus/search?q=search%20index%3Dcolossus%20sender%3Dvtex.render-server%40*%20body.requestId%3D${rid}&display.page.search.mode=verbose&dispatch.sample_ratio=1&earliest=-5m%40m&latest=now`

export default class ErrorPage extends Component {
  public render() {
    return (
      <div>
        Error: {__REQUEST_ID__}
        <a href={toSplunkLink(__REQUEST_ID__)} target="_blank">Search for this error in Splunk</a>
      </div>
    )
  }
}

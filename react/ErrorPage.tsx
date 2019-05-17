import React, { Component, Fragment } from 'react'
import ReactJson from 'react-json-view'

import ErrorImg from './images/error-img.png'

import style from './error.css'

const toSplunkLink = (rid: string) =>
  `https://splunk7.vtex.com/en-US/app/vtex_colossus/search?q=search%20index%3Dcolossus%20sender%3Dvtex.render-server%40*%20body.requestId%3D${rid}&display.page.search.mode=verbose&dispatch.sample_ratio=1&earliest=-5m%40m&latest=now`

export default class ErrorPage extends Component {
  public state = { enabled: false }
  private splunk = 0

  public componentDidMount() {
    window.setTimeout(() => {
      this.setState({ enabled: true })
    }, 5000)
  }

  public render() {
    return (
      <div className="h-100 flex flex-column mh6 mh0-ns error-height pt3 pt10-ns">
        <div>
          {this.renderErrorInfo()}
          {window.__ERROR__ && this.renderErrorDetails(window.__ERROR__)}
        </div>
      </div>
    )
  }

  private renderErrorInfo = () => {
    const date = new Date()

    return (
      <div className="flex justify-center-ns flex-row-ns flex-column-reverse h-auto-ns pt0-ns pb8">
        <div className="mr9-ns mr0">
          <div className="f2 c-on-base">Something went wrong</div>
          <div className="f5 pt5 c-on-base lh-copy">
            <div>There was a technical problem loading this page.</div>
            <div>Try refreshing the page or come back in 5 minutes.</div>
          </div>
          <div
            className="f6 pt5 c-muted-2"
            style={{ fontFamily: 'courier, code' }}
          >
            <div>ID: {window.__REQUEST_ID__}</div>
            <div className="f6 c-muted-2 lh-copy fw7">{date.toUTCString()}</div>
          </div>
          <div className="pt7">
            <button
              className={
                'bw1 ba fw5 ttu br2 fw4 v-mid relative pv4 ph6 f5 ' +
                (this.state.enabled
                  ? 'bg-action-primary b--action-primary c-on-action-primary hover-bg-action-primary hover-b--action-primary hover-c-on-action-primary pointer'
                  : 'bg-disabled b--disabled c-on-disabled')
              }
              disabled={!this.state.enabled}
              onClick={() => {
                window.location.reload()
              }}
            >
              Refresh
            </button>
          </div>
        </div>
        <div>
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
          <img
            src={ErrorImg}
            onKeyDown={e => e.key === 'Enter' && this.handleImageClick()}
            onClick={this.handleImageClick}
            className={`${style.imgHeight} pb6 pb0-ns`}
            alt=""
          />
        </div>
      </div>
    )
  }

  private renderErrorDetails = (error: any) => {
    return (
      <div>
        <div
          className={`${
            style.errorStack
          } bg-danger--faded pa7 mt4 br3 t-body lh-copy`}
        >
          {error.stack.split('\n').map((item: string, key: number) => {
            return (
              <Fragment key={key}>
                {item}
                <br />
              </Fragment>
            )
          })}
        </div>
        <div
          className={`${
            style.errorDetails
          } bg-warning--faded pa7 mt4 br3 lh-copy`}
        >
          <ReactJson src={error.details} />
        </div>
      </div>
    )
  }

  private handleImageClick = () => {
    if (this.splunk < 2) {
      this.splunk = this.splunk + 1
    } else {
      window.open(toSplunkLink(window.__REQUEST_ID__), '_blank')
      this.splunk = 0
    }
  }
}

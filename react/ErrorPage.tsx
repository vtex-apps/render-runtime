import React, {Component} from 'react'

export default class ErrorPage extends Component {
  public render() {
    return (
      <div>Error: {JSON.stringify(__RUNTIME__.error)}</div>
    )
  }
}

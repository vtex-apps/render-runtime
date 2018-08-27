import React, {Component, ReactElement} from 'react'
import Loading from './Loading'
import {RenderContextProps, withRuntimeContext} from './RenderContext'

interface State {
  ensured: boolean
  error: any
}

interface Props {
  children: ReactElement<any>
}

class Session extends Component<Props & RenderContextProps, State> {
  public state = {ensured: false, error: null}

  public componentDidMount() {
    this.onUpdate()
  }

  public componentDidUpdate() {
    this.onUpdate()
  }

  public render() {
    const {children} = this.props
    const {ensured, error} = this.state

    if (ensured) {
      return children
    }

    if (error) {
      return (
        <div className="bg-washed-red pa6 f5 serious-black br3 pre">
          <span>Error initializing session</span>
          <pre>
            <code className="f6">
              {error}
            </code>
          </pre>
        </div>
      )
    }

    return <Loading />
  }

  private onUpdate() {
    const {runtime: {ensureSession}} = this.props
    const {ensured, error} = this.state

    if (ensured || error) {
      return
    }

    ensureSession()
      .then(() => {
        this.setState({ensured: true})
      })
      .catch((err: any) => {
        this.setState({error: err})
      })
  }
}

export default withRuntimeContext(Session)

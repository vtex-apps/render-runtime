import React, {PureComponent} from 'react'
import Loading from './Loading'

const LOGIN_PATH = '/login'
const AUTH_STORE_URL = '/_v/private/authenticated/store'

interface Props {
  navigate: (navigateOptions: object) => {},
  page: string,
  pages: Record<string, Record<string, any>>,
  render: (props: any) => JSX.Element
}

interface State {
  loading: boolean
  logged?: boolean
}

export default class MaybeAuth extends PureComponent<Props, State> {
  public state = { loading: true, logged: false }

  public componentDidMount() {
    this.onUpdate()
  }

  public componentDidUpdate() {
    this.onUpdate()
  }

  public isAuthenticatedPage() {
    return this.props.pages[this.props.page].login
  }

  public redirectToLogin() {
    this.props.navigate({
      fallbackToWindowLocation: false,
      to: LOGIN_PATH,
    })
  }

  public render() {
    const {render, navigate, page, pages, children, ...parentProps} = this.props
    const {logged, loading} = this.state

    if (!this.isAuthenticatedPage()) {
      return render(parentProps)
    }

    if (loading) {
      return <div className="flex justify-center ma4"><Loading /></div>
    }

    if (logged) {
      return render(parentProps)
    }

    return null
  }

  private onUpdate() {
    if (this.isAuthenticatedPage()) {
      fetch(AUTH_STORE_URL, { credentials: 'same-origin' })
      .then(response => response.json())
      .then(({ authenticated }) => {
        this.setState({
          loading: false,
          logged: authenticated
        })
        if (!authenticated) {
          this.redirectToLogin()
        }
      }).catch(err => {
        this.setState({
          loading: false,
          logged: false
        })
        this.redirectToLogin()
      })
    }
  }
}

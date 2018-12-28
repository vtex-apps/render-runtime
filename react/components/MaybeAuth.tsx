import React, {PureComponent} from 'react'
import Loading from './Loading'

const LOGIN_PATH = '/login'
const API_SESSION_URL = '/api/sessions?items=*'

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
    return this.props.pages[this.props.page].login || this.props.pages[this.props.page].auth
  }

  public redirectToLogin() {
    const pathName = window.location.pathname.replace(/\/$/, '')
    if (this.props.page !== 'store.login' && pathName !== LOGIN_PATH) {
      this.props.navigate({
        fallbackToWindowLocation: false,
        to: LOGIN_PATH,
        query: `returnUrl=${pathName}`
      })
    }
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
      fetch(API_SESSION_URL, { credentials: 'same-origin' })
        .then(response => response.json())
        .then(response => {
          if (
            response.namespaces &&
            (response.namespaces.authentication.storeUserId ||
            response.namespaces.impersonate.storeUserId)
          ) {
            this.setState({ loading: false, logged: true })
          } else {
            this.setState({ loading: false, logged: false })
            this.redirectToLogin()
          }
        })
        .catch(() => {
          this.setState({ loading: false, logged: false })
          this.redirectToLogin()
        })
    }
  }
}

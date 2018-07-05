import PropTypes from 'prop-types'
import React, {PureComponent} from 'react'

const LOGIN_PATH = '/login'
const AUTH_STORE_URL = '/_v/private/authenticated/store'

interface Props {
  navigate: (navigateOptions: object) => {},
  page: string,
  pages: Record<string, Record<string, any>>,
  segment: string,
  children: JSX.Element
}

interface State {
  loading: boolean
  logged?: boolean
}

export default class AuthWrapper extends PureComponent<Props, State> {
  public state = { loading: true, logged: false }
  
  public componentDidMount() {
    if (this.isAuthenticatedPage()) {
      fetch(AUTH_STORE_URL)
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

  public isAuthenticatedPage() {
    console.log('point', this.props.pages[this.props.page].login, this.getBreakPoint(), this.props.segment)
    return this.props.pages[this.props.page].login && this.getBreakPoint() === this.props.segment
  }

  public redirectToLogin() {
    this.props.navigate({
      fallbackToWindowLocation: false,
      to: LOGIN_PATH,
    })
  }

  public getBreakPoint() {
    const { pages, page } = this.props
    const [point] = page.split('/').slice(-1)
    return point
  }

  public render() {
    if (this.isAuthenticatedPage()) {
      const { logged, loading } = this.state
      console.log(logged, loading)
      return loading ? 
        <div className="flex justify-center ma4">Loading...</div> : null
    }
    return this.props.children
  }
}

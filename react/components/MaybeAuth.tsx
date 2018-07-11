import PropTypes from 'prop-types'
import React, {PureComponent} from 'react'
import Loading from './Loading'

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

export default class MaybeAuth extends PureComponent<Props, State> {
  public state = { loading: true, logged: false }
  
  public componentDidMount() {
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

  public isAuthenticatedPage() {
    const pathValues = this.props.page.split('/')
    for (let i = 0; i < pathValues.length; i++) {
      const path = pathValues.slice(0, i + 1)
      const pagesPath = this.props.pages[path.join('/')]
      if (pagesPath && pagesPath.login &&
        this.getBreakPoint(path.join('/')) === this.props.segment) {
          return true
      }
    }
    return false
  }

  public redirectToLogin() {
    this.props.navigate({
      fallbackToWindowLocation: false,
      to: LOGIN_PATH,
    })
  }

  public getBreakPoint(page: string) {
    const [point] = page.split('/').slice(-1)
    return point
  }

  public render() {
    if (this.isAuthenticatedPage()) {
      const { logged, loading } = this.state
      if (loading) {
        return <div className="flex justify-center ma4"><Loading /></div>
      } else if (logged) {
        return this.props.children
      }
      return null
    }
    return this.props.children
  }
}

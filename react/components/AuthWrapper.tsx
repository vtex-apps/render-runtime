import axios from 'axios'
import gql from 'graphql-tag'
import PropTypes from 'prop-types'
import React, {PureComponent} from 'react'

const LOGIN_PATH = '/login'
const AUTH_STORE_URL = '/_v/private/authenticated/store'

interface Props {
  fallBack: (loading?: boolean, logged?: boolean, point?: string) => {},
  navigate: (navigateOptions: object) => {},
  page: string,
  pages: Record<string, Record<string, any>>
}

interface State {
  loading: boolean
  logged?: boolean
}

export default class AuthWrapper extends PureComponent<Props, State> {
  public constructor(props: Props) {
    super(props)
    const url = 
    this.state = { loading: false }
    if (this.isAuthenticatedPage(props)) {
      this.state = { loading:true, logged: false }
      axios({ 
        method: 'GET', 
        url: AUTH_STORE_URL,
      }).then(({ data: { authenticated } }) => {
        this.setState({
          loading: false,
          logged: authenticated
        })
        if (!authenticated) {
          this.redirectToLogin()
        }
      }, err => {
        this.setState({
          loading: false,
          logged: false
        })
        this.redirectToLogin()
      })
    }
  }

  public isAuthenticatedPage(props: Props) {
    return props.pages[props.page].login
  }

  public redirectToLogin() {
    this.props.navigate({
      fallbackToWindowLocation: false,
      page: this.getLoginPage(),
    })
  }

  public getLoginPage() {
    const { pages } = this.props
    const pagesFiltered = Object.entries(pages).filter((entry: Record<any, any>) => {
      const [value, ...rest] = entry.reverse()
      return value.path === LOGIN_PATH
    })
    const [[pageValue, loginPage]] = pagesFiltered
    return loginPage
  }

  public getBreakPoint() {
    const { pages, page } = this.props
    const [point] = page.split('/').slice(-1)
    return point
  }

  public render() {
    const { logged, loading } = this.state
    if (this.isAuthenticatedPage(this.props)) {
      return this.props.fallBack(loading, logged, this.getBreakPoint())
    }
    return this.props.fallBack()
  }
}

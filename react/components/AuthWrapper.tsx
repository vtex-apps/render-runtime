import gql from 'graphql-tag'
import PropTypes from 'prop-types'
import React, {Component, ReactElement} from 'react'
import {graphql} from 'react-apollo'
import {Helmet} from 'react-helmet'

import BuildStatus from './BuildStatus'
import ExtensionPointComponent from './ExtensionPointComponent'
import NestedExtensionPoints from './NestedExtensionPoints'

const LOGIN_PATH = '/login'

class AuthWrapper extends Component {
  public static propTypes = {
    children: PropTypes.element,
    data: PropTypes.object,
    navigate: PropTypes.func,
    page: PropTypes.string,
    pages: PropTypes.object
  }

  public getLoginPage(pages: object) {
    const pagesFiltered = Object.entries(pages).filter(entry => {
      const [value, ...rest] = entry.reverse()
      return value.path === LOGIN_PATH
    })
    const [[pageValue, loginPage]] = pagesFiltered
    return loginPage
  }

  public componentDidMount() {
    const { pages, page, data: { loading, profile }, navigate } = this.props
    if (pages[page].login && !loading && !profile) {
      const loginPage = this.getLoginPage(pages)
      if (loginPage) {
        navigate({
          fallbackToWindowLocation: false,
          page: loginPage,
        })
      }
    }
  }

  public render() {
    return this.props.children
  }
}

export default graphql(gql`
  query getProfile {
    profile {
      id
    }
  }
`, {
  options: { errorPolicy: 'all' },
})(AuthWrapper)

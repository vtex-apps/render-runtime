import React, {Component, ReactElement} from 'react'
import PropTypes from 'prop-types'
import {graphql} from 'react-apollo'
import gql from 'graphql-tag'
import {Helmet} from 'react-helmet'

import BuildStatus from './BuildStatus'
import ExtensionPointComponent from './ExtensionPointComponent'
import NestedExtensionPoints from './NestedExtensionPoints'

const LOGIN_PAGE = "store/login"

class AuthWrapper extends Component {
  static propTypes = {
    children: PropTypes.element,
    pages: PropTypes.object,
    page: PropTypes.string,
    navigate: PropTypes.func,
    data: PropTypes.object
  }

  componentDidMount() {
    const { pages, page, data: { loading, profile }, navigate } = this.props
    if (pages[page].login && !loading && !profile) {
      navigate({
        page: LOGIN_PAGE,
        fallbackToWindowLocation: false,
      })
    }
  }

  render() {
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

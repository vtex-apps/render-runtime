import React, {Component, PropTypes} from 'react'

class RenderProvider extends Component {
  getChildContext () {
    return {
      account: this.props.account,
      placeholders: this.props.placeholders,
      route: this.props.route,
    }
  }

  render () {
    return React.Children.only(this.props.children)
  }
}

RenderProvider.propTypes = {
  children: PropTypes.element.isRequired,
  account: PropTypes.string,
  placeholders: PropTypes.object,
  route: PropTypes.string,
}

RenderProvider.childContextTypes = {
  account: PropTypes.string,
  placeholders: PropTypes.object,
  route: PropTypes.string,
}

export default RenderProvider

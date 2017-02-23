import React, {Component, PropTypes} from 'react'

class PlaceholderProvider extends Component {
  getChildContext () {
    return {placeholders: this.props.placeholders}
  }

  render () {
    return React.Children.only(this.props.children)
  }
}

PlaceholderProvider.propTypes = {
  children: PropTypes.element.isRequired,
  placeholders: PropTypes.object,
}

PlaceholderProvider.childContextTypes = {
  placeholders: PropTypes.object,
}

export default PlaceholderProvider

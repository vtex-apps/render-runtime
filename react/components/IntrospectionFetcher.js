import {toIdValue} from 'apollo-utilities'
import {Component} from 'react'
import {graphql} from 'react-apollo'
import PropTypes from 'prop-types'
import IntrospectionQuery from './Introspection.graphql'

const PREFIX_REGEX = /.+?\d+_\d+_\d+(?:build\d+)?_/

const addIdResolver = (
  resolvers,
  dataId,
  {name, type: {kind, name: typeName, ofType}, args},
) => {
  const [, alias] = name.split(PREFIX_REGEX)
  if (resolvers[alias]) {
    // Do not try to cache types with duplicate aliases, as that can cause conflicts.
    resolvers[alias] = null
    return
  }

  if (kind === 'NON_NULL') {
    typeName = ofType.name
  }
  if (typeName && args.length === 1 && args[0].name === 'id') {
    const fn = (_, {id}) => toIdValue(dataId({__typename: typeName, id}))
    resolvers[alias] = fn
  }
}

class IntrospectionFetcher extends Component {
  static contextTypes = {
    client: PropTypes.object,
  }

  static propTypes = {
    data: PropTypes.object,
  }

  resolversGenerated = false

  componentDidMount() {
    this.tryGenerateCacheResolvers()
  }

  componentDidUpdate() {
    this.tryGenerateCacheResolvers()
  }

  render() {
    return null
  }

  tryGenerateCacheResolvers = () => {
    if (this.resolversGenerated || !this.props.data.__type) {
      return
    }

    const {client} = this.context
    const {data: {__type: {fields}}} = this.props
    const resolvers = {}

    for (let i = 0; i < fields.length; i++) {
      addIdResolver(resolvers, client.cache.config.dataIdFromObject, fields[i])
    }

    client.cache.config.cacheResolvers = {Query: resolvers}
    this.resolversGenerated = true
  }
}

export default graphql(IntrospectionQuery)(IntrospectionFetcher)

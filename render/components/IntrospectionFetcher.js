import {toIdValue} from 'apollo-client'
import {Component, PropTypes} from 'react'
import {graphql} from 'react-apollo'
import query from './query.gql'

const PREFIX_REGEX = /.+?\d+_\d+_\d+(?:build\d+)?_/

const addIdResolver = (resolvers, dataId, {name, type: {kind, name: typeName, ofType}, args}) => {
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
  componentDidMount () {
    const {client} = this.context
    const {data: {__type: {fields}}} = this.props
    const resolvers = {}
    for (let i = 0; i < fields.length; i++) {
      addIdResolver(resolvers, client.dataId, fields[i])
    }
    client.reducerConfig.customResolvers = {Query: resolvers}
  }

  render () {
    return null
  }
}

IntrospectionFetcher.contextTypes = {
  client: PropTypes.object,
}

IntrospectionFetcher.propTypes = {
  data: PropTypes.object,
}

export default graphql(query)(IntrospectionFetcher)

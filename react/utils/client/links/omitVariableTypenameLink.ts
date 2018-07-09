import {ApolloLink, NextLink, Operation} from 'apollo-link'

// Function extracted from https://gist.github.com/aurbano/383e691368780e7f5c98
function removeKeys(obj, keys){
  let index
  for (const prop in obj) {
      // important check that this is objects own property
      // not from prototype prop inherited
      if(obj.hasOwnProperty(prop)){
          switch(typeof(obj[prop])){
              case 'string':
                  index = keys.indexOf(prop)
                  if(index > -1){
                      delete obj[prop]
                  }
                  break
              case 'object':
                  index = keys.indexOf(prop)
                  if(index > -1){
                      delete obj[prop]
                  }else{
                      removeKeys(obj[prop], keys)
                  }
                  break
          }
      }
  }
}

export const omitTypenameLink = new ApolloLink((operation: Operation, forward?:  NextLink) => {
    if (operation.variables) {
      removeKeys(operation.variables, ['__typename'])
    }
    return forward ? forward(operation) : null
})

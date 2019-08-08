interface ComponentDependencyNode{
  app: string
  component: ComponentEntry
  dependents: ComponentDependencyTree
  length: number
}

export type ComponentDependencyTree = Record<string, ComponentDependencyNode>

const prependUniq = (arrOne: any[], arrTwo: any[]) => {
  return [...arrOne, ...arrTwo.filter(item => !arrOne.includes(item))]
}

export const traverseComponent = (
  components: Components | Record<string, string[]>,
  component: string
): ComponentTraversalResult => {
  const entry = components[component]
  const [app] = component.split('/')
  if (Array.isArray(entry)) {
    return { apps: [app], assets: entry }
  }

  const { dependencies, assets } = entry
  return dependencies
    .map(dep => traverseComponent(components, dep))
    .reduce(
      (acc, dependency) => ({
        apps: prependUniq(dependency.apps, acc.apps),
        assets: prependUniq(dependency.assets, acc.assets),
      }),
      { apps: [app], assets }
    )
}

export const getComponentsDependencyTree = (components: Components) => {
  const dependenciesTree: ComponentDependencyTree = {}
  Object.keys(components).forEach(componentKey => {
    addComponentDependencyNode(components, dependenciesTree, componentKey, components[componentKey])
  })
  return dependenciesTree
}

const addComponentDependencyNode = (
  components: Components, dependenciesTree: ComponentDependencyTree,
  componentKey: string, component: ComponentEntry) => {

  const [app] = componentKey.split('/')
  let node = dependenciesTree[app]
  if(!node){
    const appDependencies = new Set(component.dependencies.map(dependencyKey => dependencyKey.split('/')[0]))
    node = { app, component, dependents: {}, length: appDependencies.size}
    dependenciesTree[app] = node
    component.dependencies.forEach(dependencyKey => {
      const [dependencyApp] = dependencyKey.split('/')
      let dependencyNode = dependenciesTree[dependencyApp]
      if(!dependencyNode){
        dependencyNode = addComponentDependencyNode(components, dependenciesTree, dependencyKey, components[dependencyKey])
      }
      dependencyNode.dependents[app] = node
    })
  }
  return node
}
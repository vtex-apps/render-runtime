import { useExtension } from '../hooks/extension'

export interface ChildBlockType {
  id: string
}

export interface Block {
  props: Record<string, any>
}

function useChildBlock(childBlock: ChildBlockType): Block | null {
  if (typeof childBlock === 'string') {
    throw new Error(
      `You are passing a string as a parameter to useChildBlock ("${childBlock}"). You should pass an object like {id: "${childBlock}"}.`
    )
  }

  const { id } = childBlock

  if (!id) {
    throw new Error('The id you are sending to useChildBlock is empty')
  }

  const extension = useExtension({ children: id })

  // We are explicitly not exposing the private API here
  return extension ? { props: extension.props } : null
}

export default useChildBlock

import { forEach } from 'ramda'
import { PureComponent } from 'react'
import ReactDOM from 'react-dom'

interface Props {
  events?: string[]
  id?: string
}

const sendEvent = (id: string, event: string) => {
  window.vtex.NavigationCapture.sendEvent(
    'pageComponentInteraction',
    {
      pageComponentInteraction : {
        componentId: id,
        interactionType: event,
      }
    }
  )
}

class TrackEventsWrapper extends PureComponent<Props> {

  public eventsHandler: Record<string, () => void> = {}

  public componentDidMount(){
    const { id, events } = this.props
    if(events && events.length && id){
      const element = ReactDOM.findDOMNode(this)
      if(element && element.addEventListener){
        forEach(
          event => {
            this.eventsHandler[event] = () => sendEvent(id, event)
            element.addEventListener(event, this.eventsHandler[event])
          }
        , events)
      }
    }
  }

  public componentWillUnmount(){
    const { id, events } = this.props
    if(events && events.length && id){
      const element = ReactDOM.findDOMNode(this)
      if(element && element.addEventListener){
        forEach(
          event => element.removeEventListener(event, this.eventsHandler[event])
        , events)
      }
    }
  }

  public render(){
    const { children } = this.props
    return children
  }
}

export default TrackEventsWrapper

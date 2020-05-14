import React, { FC, ComponentType } from 'react'
import { useSSR } from '../components/NoSSR'
import { useMedia } from 'use-media'

export interface Props {
  runtime: RenderRuntime
}

export interface WithDeviceProps {
  deviceInfo: DeviceInfo
}

export enum Device {
  phone = 'phone',
  tablet = 'tablet',
  desktop = 'desktop',
  unknown = 'unknown',
}

export interface DeviceInfo {
  type: Device
  isMobile: boolean
}

const useDevice = (hints: RenderHints) => {
  const isSSR = useSSR()

  /** These screensizes are hardcoded, based on the default
   * Tachyons breakpoints. They should probably be the ones
   * configured via the style.json file, if available. */
  const isScreenMedium = useMedia({ minWidth: '40rem' })
  const isScreenLarge = useMedia({ minWidth: '64.1rem' })

  const serverDevice = {
    type: hints.phone
      ? Device.phone
      : hints.tablet
      ? Device.tablet
      : Device.desktop,
    isMobile: hints.mobile,
  }

  const clientDevice = {
    type: isScreenLarge
      ? Device.desktop
      : isScreenMedium
      ? Device.tablet
      : Device.phone,
    isMobile: !isScreenLarge,
  }

  return isSSR ? serverDevice : clientDevice
}

export const withDevice = <P extends Props>(
  Component: ComponentType<P & WithDeviceProps>
): FC<P> => {
  const WithDevice = ({ ...props }: P) => {
    const hints = props.runtime.hints
    const deviceInfo = useDevice(hints)

    return <Component deviceInfo={deviceInfo} {...(props as P)} />
  }

  return WithDevice
}

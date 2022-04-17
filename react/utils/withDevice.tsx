import React, { FC, ComponentType } from 'react'
import { useSSR } from '../components/NoSSR'
import { useMediaLayout } from 'use-media'
import { RenderRuntime } from '../typings/runtime'

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

const useDevice = (hints: RenderRuntime['hints']) => {
  const isSSR = useSSR()

  /** These screensizes are hardcoded, based on the default
   * Tachyons breakpoints. They should probably be the ones
   * configured via the style.json file, if available. */

  const isTabletScreen = useMediaLayout({ minWidth: '40rem' })
  const isMobileScreen = useMediaLayout({ maxWidth: '64rem' })

  const serverDevice = {
    type: hints.phone
      ? Device.phone
      : hints.tablet
      ? Device.tablet
      : Device.desktop,
    isMobile: hints.mobile,
  }

  const clientDevice = {
    type: isMobileScreen
      ? isTabletScreen
        ? Device.tablet
        : Device.phone
      : Device.desktop,
    isMobile: isMobileScreen,
  }

  return isSSR ? serverDevice : clientDevice
}

export const withDevice = <P extends Props>(
  Component: ComponentType<P & WithDeviceProps>
): FC<P> => {
  const MemoizedWithDevice = React.memo(
    ({ type, isMobile, ...props }: DeviceInfo & Props) => (
      <Component deviceInfo={{ type, isMobile }} {...(props as P)} />
    )
  )

  MemoizedWithDevice.displayName = 'MemoizedWithDevice'

  const WithDevice = ({ ...props }: P) => {
    const hints = props.runtime.hints
    const deviceInfo = useDevice(hints)

    return (
      <MemoizedWithDevice
        type={deviceInfo.type}
        isMobile={deviceInfo.isMobile}
        {...props}
      />
    )
  }

  return WithDevice
}

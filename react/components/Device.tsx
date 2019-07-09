import React from 'react'
import { useMedia } from 'use-media'
import { useSSR } from './NoSSR'
import { useRuntime } from './RenderContext'

interface DeviceInfo {
  device: DeviceType
  isMobile: boolean
}

enum DeviceType {
  phone = 'phone',
  tablet = 'tablet',
  desktop = 'desktop',
}

const useDevice = () => {
  const isSSR = useSSR()
  const { hints } = useRuntime()

  /** These screensizes are hardcoded, based on the default
   * Tachyons breakpoints. They should probably be the ones
   * configured via the style.json file, if available. */
  const isScreenMedium = useMedia({ minWidth: '40rem' })
  const isScreenLarge = useMedia({ minWidth: '64rem' })

  if (isSSR) {
    return {
      device: hints.phone
        ? DeviceType.phone
        : hints.tablet
        ? DeviceType.tablet
        : DeviceType.desktop,
      isMobile: hints.mobile,
    }
  }

  return {
    device: isScreenLarge
      ? DeviceType.desktop
      : isScreenMedium
      ? DeviceType.tablet
      : DeviceType.phone,
    isMobile: !isScreenLarge,
  }
}

const Device = ({
  children,
}: {
  children: (deviceInfo: DeviceInfo) => React.ReactNode
}) => {
  const { device, isMobile } = useDevice()

  return children({ device, isMobile })
}

export { useDevice, Device }

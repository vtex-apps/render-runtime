import React, { FunctionComponent } from 'react'
import styles from './ContentLoader.css'

// TODO: make these colors dynamic, probably based on
// muted colors from the color theme
const PRIMARY_COLOR = '#e8e8e8'
const SECONDARY_COLOR = '#e0e0e0'

interface RectProps {
  x?: number
  y?: number
  width: number | string
  height: number | string
  preserveAspectRatio?: string
  borderRadius?: number | string
}

const Rect: FunctionComponent<RectProps> = ({
  x = 0,
  y = 0,
  width,
  height,
  borderRadius = 5,
}) => (
  <div
    style={{
      width,
      height,
      overflow: 'hidden',
      position: 'absolute',
      top: y,
      left: x,
      borderRadius,
    }}
  >
    <div
      className={styles.slide}
      style={{
        width: '300vw',
        height: '100%',
        position: 'relative',
        left: -x,
        backgroundColor: SECONDARY_COLOR,
        backgroundImage: `linear-gradient(90deg, ${SECONDARY_COLOR}, ${SECONDARY_COLOR} 50%, ${PRIMARY_COLOR} 60%, ${SECONDARY_COLOR} 65%, ${SECONDARY_COLOR})`,
        backgroundSize: '50% 100%',
        backgroundRepeat: 'repeat-x',
      }}
    />
  </div>
)

interface ContentLoaderProps {
  width: number | string
  height: number | string
}

const ContentLoader: FunctionComponent<ContentLoaderProps> = ({
  width,
  height,
  children,
}) => (
  <div style={{ width, height, position: 'relative' }} suppressHydrationWarning>
    {children}
  </div>
)

export { ContentLoader, Rect }

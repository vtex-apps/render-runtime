import React, { FunctionComponent } from 'react'
import styles from './ContentLoader.css'

// TODO: make these colors dynamic, probably based on
// muted colors from the color theme
const PRIMARY_COLOR = '#fafafa'
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
        backgroundColor: '#fff',
        backgroundImage: `linear-gradient(90deg, ${PRIMARY_COLOR}, ${SECONDARY_COLOR}, ${PRIMARY_COLOR}, ${SECONDARY_COLOR}, ${PRIMARY_COLOR})`,
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

import React, { FunctionComponent } from 'react'

import ReactContentLoader, { IContentLoaderProps } from 'react-content-loader'

interface Props {
  width: number
  height: number
  preserveAspectRatio?: string
}

const ContentLoader: FunctionComponent<Props> = ({
  children,
  width,
  height,
  preserveAspectRatio = 'none',
}) => (
  <ReactContentLoader
    width={width}
    height={height}
    /** TODO: get these colors from the store theme */
    primaryColor="#fafafa"
    secondaryColor="#efefef"
    preserveAspectRatio={
      preserveAspectRatio as IContentLoaderProps['preserveAspectRatio']
    }
    style={{
      height,
      maxWidth: width,
      width: '100%',
    }}
  >
    {children}
  </ReactContentLoader>
)

export default ContentLoader

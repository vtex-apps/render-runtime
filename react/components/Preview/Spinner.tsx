import React from 'react'

interface Props {
  width: number
  height: number
}

const Spinner = ({width, height}: Props) => (
  <div className="flex items-center justify-center" style={{ width, height }}>
    <svg width="26px" height="26px" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink">
      <use xlinkHref="#sti-loading" />
    </svg>
  </div>
)

export default Spinner
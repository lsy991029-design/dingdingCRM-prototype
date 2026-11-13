import React, { useEffect, useRef } from 'react';
import styles from './style.module.css';
interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: string | number;
    width?: string | number;
    height?: string | number;
    spin?: boolean;
    rtl?: boolean;
    color?: string;
    fill?: string;
    stroke?: string;
}

export default function Suoxiaoquanping(props: IconProps) {
    const root = useRef<SVGSVGElement>(null)
    const { size = '1em', width, height, spin, rtl, color, fill, stroke, className, ...rest } = props;
    const _width = width || size;
    const _height = height || size;
    const _stroke = stroke || color;
    const _fill = fill || color;
    useEffect(() => {
      if (!_fill) {
        (root.current as SVGSVGElement)?.querySelectorAll('[data-follow-fill]').forEach(item => {
          item.setAttribute('fill', item.getAttribute('data-follow-fill') || '')
        })
      }
      if (!_stroke) {
        (root.current as SVGSVGElement)?.querySelectorAll('[data-follow-stroke]').forEach(item => {
          item.setAttribute('stroke', item.getAttribute('data-follow-stroke') || '')
        })
      }
    }, [stroke, color, fill])
    return (
        <svg
          ref={root}
          width={_width} 
          height={_height}
          viewBox="0 0 48 48"
          preserveAspectRatio="xMidYMid meet"
          fill=""
          role="presentation"
          xmlns="http://www.w3.org/2000/svg"
          className={`${className || ''} ${spin ? styles.spin : ''} ${rtl ? styles.rtl : ''}`.trim()}
          {...rest}
        >
          <g><path data-follow-fill="currentColor" fillRule="evenodd" d="M40.125 27a1.875 1.875 0 0 1 0 3.75l-6.724-.001 7.065 7.066a1.875 1.875 0 0 1-2.651 2.651l-7.066-7.065.001 6.724a1.875 1.875 0 1 1-3.75 0v-11.25c0-1.036.84-1.875 1.875-1.875h11.25Zm-32.25 0h11.25c1.036 0 1.875.84 1.875 1.875v11.25a1.875 1.875 0 0 1-3.75 0l.001-6.724-7.066 7.065a1.875 1.875 0 0 1-2.651-2.651l7.065-7.066-6.724.001a1.875 1.875 0 0 1 0-3.75Zm11.25-21C20.161 6 21 6.84 21 7.875v11.25c0 .986-.761 1.795-1.728 1.87l-.147.005H7.875a1.875 1.875 0 0 1 0-3.75l6.724.001-7.065-7.066a1.875 1.875 0 0 1 2.651-2.651l7.065 7.064V7.875c0-1.036.84-1.875 1.875-1.875Zm9.75 0c1.036 0 1.875.84 1.875 1.875v6.723l7.065-7.064a1.875 1.875 0 1 1 2.651 2.651l-7.065 7.066 6.724-.001a1.875 1.875 0 0 1 0 3.75h-11.25l-.147-.006A1.875 1.875 0 0 1 27 19.125V7.875C27 6.839 27.84 6 28.875 6Z" fill={_fill}/></g>
        </svg>
    )
}

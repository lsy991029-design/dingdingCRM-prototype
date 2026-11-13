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

export default function Dingwei(props: IconProps) {
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
          <g><g data-follow-fill="currentColor" fillRule="evenodd" transform="translate(3 3)" fill={_fill}><path d="M21-2a2 2 0 0 1 1.995 1.85L23 0l.001 1.099c9.615.955 17.226 8.719 17.944 18.401H42a2 2 0 0 1 .15 3.995L42 23.5h-1.155c-1.149 9.213-8.563 16.48-17.844 17.401L23 42a2 2 0 0 1-3.995.15L19 42v-1.099c-9.281-.921-16.696-8.188-17.845-17.4L0 23.5a2 2 0 0 1-.15-3.995L0 19.5h1.055C1.773 9.817 9.385 2.053 19 1.1V0a2 2 0 0 1 2-2Zm0 7C12.163 5 5 12.163 5 21s7.163 16 16 16 16-7.163 16-16S29.837 5 21 5Z" fillRule="nonzero"/><circle cx="21" cy="21" r="5"/></g></g>
        </svg>
    )
}

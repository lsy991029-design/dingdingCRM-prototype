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

export default function IconCustomer(props: IconProps) {
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
          <g><path data-follow-fill="currentColor" d="M29.046 29.21a2 2 0 0 1 2.313-1.627C39.21 28.949 44 32.773 44 38c0 3.79-2.574 5.905-6 5.997l-.235.003h-27.53C6.692 44 4 41.877 4 38c0-5.226 4.79-9.05 12.64-10.417a2 2 0 1 1 .686 3.94C11.168 32.597 8 35.126 8 38c0 1.372.662 1.951 2.05 1.997l.185.003h27.53l.185-.003C39.338 39.951 40 39.372 40 38c0-2.876-3.168-5.405-9.326-6.477a2 2 0 0 1-1.628-2.313Zm-2.188-2.26a.7.7 0 0 1 .43 1.252l-2.118 1.645 1.646 4.125a1 1 0 0 1-.072.886l-1.887 3.138a1 1 0 0 1-1.714 0l-1.887-3.134a1 1 0 0 1-.072-.886l1.621-4.07-2.193-1.704a.7.7 0 0 1 .43-1.252h5.816ZM24 3c6.075 0 11 4.925 11 11s-4.925 11-11 11-11-4.925-11-11S17.925 3 24 3Zm0 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z" fill={_fill}/></g>
        </svg>
    )
}

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

export default function Daochu(props: IconProps) {
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
          <g><path data-follow-fill="currentColor" fillRule="evenodd" d="M41 27a2 2 0 0 1 1.995 1.85L43 29v8a6 6 0 0 1-5.775 5.996L37 43H11a6 6 0 0 1-5.996-5.775L5 37v-8a2 2 0 0 1 3.995-.15L9 29v8a2 2 0 0 0 1.85 1.995L11 39h26a2 2 0 0 0 1.995-1.85L39 37v-8a2 2 0 0 1 2-2ZM25.414 5.1l9.9 9.9a2 2 0 1 1-2.829 2.828L26 11.342V31a2 2 0 1 1-4 0V11.342l-6.485 6.486A2 2 0 1 1 12.686 15l9.9-9.9a2 2 0 0 1 2.828 0Z" fill={_fill}/></g>
        </svg>
    )
}

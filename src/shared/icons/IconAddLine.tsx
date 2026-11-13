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

export default function IconAddLine(props: IconProps) {
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
          <g><path data-follow-fill="currentColor" d="M24 3c11.598 0 21 9.402 21 21s-9.402 21-21 21S3 35.598 3 24 12.402 3 24 3Zm0 3.818C14.51 6.818 6.818 14.511 6.818 24c0 9.49 7.693 17.182 17.182 17.182 9.49 0 17.182-7.693 17.182-17.182 0-9.49-7.693-17.182-17.182-17.182ZM24 13a2 2 0 0 1 2 2v7h7a2 2 0 1 1 0 4h-7.001L26 33a2 2 0 1 1-4 0l-.001-7H15a2 2 0 1 1 0-4h7v-7a2 2 0 0 1 2-2Z" fill={_fill}/></g>
        </svg>
    )
}

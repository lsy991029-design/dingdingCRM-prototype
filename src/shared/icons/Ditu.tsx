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

export default function Ditu(props: IconProps) {
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
          <g><g fill="none" fillRule="evenodd"><path d="M0 0h48v48H0z"/><path data-follow-fill="currentColor" d="M7.245 34.964a2 2 0 0 1 3.5 1.928l-.078.144-2.198 3.63a1 1 0 0 0 .719 1.508l.136.01h28.131a1 1 0 0 0 .889-1.459l-.061-.102-2.373-3.5a2 2 0 0 1 3.214-2.377l.097.132 2.373 3.5a5 5 0 0 1-3.922 7.801l-.217.005H9.324a5 5 0 0 1-4.391-7.392l.114-.198 2.198-3.63Z" fill={_fill}/><g data-follow-fill="currentColor" fill={_fill}><path d="M24 1.846c-8.904 0-16.154 6.99-16.154 15.654 0 5.261 2.884 10.355 7.616 15.18a48.789 48.789 0 0 0 5.036 4.45l.461.351.628.466.545.389.452.31.247.163c.712.46 1.626.46 2.338 0l.538-.36.514-.364.601-.44.445-.335.235-.18a48.789 48.789 0 0 0 5.036-4.45c4.732-4.825 7.616-9.919 7.616-15.18 0-8.663-7.25-15.654-16.154-15.654Zm0 4.308c6.56 0 11.846 5.098 11.846 11.346 0 3.888-2.366 8.067-6.384 12.163a44.534 44.534 0 0 1-4.59 4.054l-.322.247-.55.408-.237-.173a44.534 44.534 0 0 1-5.226-4.536c-4.017-4.096-6.383-8.275-6.383-12.163 0-6.248 5.286-11.346 11.846-11.346Z"/><path d="M24 22a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"/></g></g></g>
        </svg>
    )
}

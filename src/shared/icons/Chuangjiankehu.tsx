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

export default function Chuangjiankehu(props: IconProps) {
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
          <g><path data-follow-fill="currentColor" fillRule="evenodd" d="m20.87 27.659.388.001c.823.007 1.622.036 2.398.086l.577.042.709.064.694.075.342.043.671.094.33.051.65.112.318.06.315.064.617.135c2.118.49 3.944 1.191 5.431 2.078l.337.208a.441.441 0 0 1 .18.508l-.01.033a3.98 3.98 0 0 0-.163.843.39.39 0 0 1-.275.344l-.078.014c-2.028.174-3.62 1.892-3.62 3.986 0 1.953 1.384 3.579 3.216 3.93l.246.039a.6.6 0 0 1 .508.436l.018.09c.052.424.17.828.342 1.2l.123.243.014.025a.206.206 0 0 1-.075.28l-.047.02a6.772 6.772 0 0 1-1.626.234l-.208.003H8.55c-3.171 0-5.58-1.916-5.58-5.415 0-4.874 4.441-8.281 11.756-9.466l.362-.056.672-.094a39.244 39.244 0 0 1 4.435-.306l.676-.004ZM38.599 30.5a1.99 1.99 0 0 1 1.98 2l-.002 1.999 1.98.001a1.99 1.99 0 0 1 1.98 2c0 1.105-.886 2-1.98 2l-1.98-.001.001 2.001c0 1.105-.886 2-1.98 2a1.99 1.99 0 0 1-1.978-2l-.001-2.001-1.979.001a1.99 1.99 0 0 1-1.98-2c0-1.105.887-2 1.98-2l1.979-.001V32.5c0-1.105.887-2 1.98-2ZM20.87 6c5.438 0 9.846 4.444 9.846 9.927 0 5.482-4.408 9.927-9.846 9.927s-9.846-4.445-9.846-9.927C11.025 10.444 15.433 6 20.87 6Z" fill={_fill}/></g>
        </svg>
    )
}

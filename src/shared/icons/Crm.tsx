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

export default function Crm(props: IconProps) {
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
          <g><path d="M12.633 33.259c-1.225.412-2.652.659-4.283.741a8.892 8.892 0 0 1-3.28-.618c-.922-.37-1.742-.864-2.471-1.606-.73-.74-1.236-1.482-1.54-2.47-.304-.988-.608-1.977-.71-3.212-.152-1.853-.071-3.582.364-5.065.313-1.605.98-2.964 1.77-4.2.79-1.235 1.832-2.1 2.996-2.84C6.643 13.246 8.071 13 9.52 13c.78 0 1.447 0 2.126.124.678.123 1.255.37 1.944.617-.06.618-.131 1.112-.314 1.606-.07.494-.242 1.112-.536 1.606-.577-.247-1.144-.37-1.6-.494-.455-.124-.9-.124-1.235-.124-1.113 0-2.095.247-2.824.865-.729.618-1.346 1.235-1.832 2.1s-.739 1.853-.87 2.965a16.697 16.697 0 0 0-.06 3.335c.122 1.482.558 2.718 1.399 3.459.84.741 1.851 1.15 3.188 1.15 1.336 0 2.44-.409 2.765-.533.615 2.06.936 3.253.963 3.583Zm3.73-19.641c.76-.247 5.468-.316 6.45-.124.789.124 4.3.83 4.77 5.188a7.08 7.08 0 0 1-.142 2.347 6.215 6.215 0 0 1-.738 1.853c-.294.494-.587.989-1.002 1.36-.415.37-.719.74-1.033.987l-.313.247 3.363 8.4C27.06 34 26.281 34 25.724 34c-.557 0-1.225 0-1.904-.124l-3.556-9.388.425-.247c.213-.123 3.31-1.738 3.269-4.941-.006-.491-.183-.865-.324-1.235-.142-.37-1.15-2.408-3.554-1.236l-1.271 17.047c-.334 0-.658.124-.992.124h-1.782c-.334 0-.668 0-1.013-.124l1.341-20.258Zm15.587-.062c.658-.124 3.452 0 3.786 0l3.036 11.18 4.983-11.18c.324-.124 3.34 0 3.563 0l-.677 20.197c-.658.123-2.997.123-3.564 0l.583-13.218-4.047 9.018c-.222 0-2.551.123-2.784 0l-2.422-9.141-1.353 13.34c-.547.124-2.663.124-3.23 0l2.126-20.196Z" data-follow-fill="#000" fill={_fill}/></g>
        </svg>
    )
}

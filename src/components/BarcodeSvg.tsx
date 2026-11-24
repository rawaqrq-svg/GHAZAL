'use client';

import React from 'react';
import { encodeCode128B } from '@/lib/barcode';

interface BarcodeSvgProps {
  value: string;
  height?: number;
  barHeight?: number;
  className?: string;
  showText?: boolean;
  textSize?: number;
}

export function BarcodeSvg({
  value,
  height = 56,
  barHeight = 40,
  className = '',
  showText = true,
  textSize = 11,
}: BarcodeSvgProps) {
  if (!value) return null;

  const { bars, totalWidth, validText } = encodeCode128B(value);
  const totalSvgHeight = showText ? barHeight + 16 : barHeight;

  return (
    <div className={`inline-flex flex-col items-center justify-center ${className}`}>
      <svg
        viewBox={`0 0 ${totalWidth} ${totalSvgHeight}`}
        className="w-full h-auto max-w-full"
        style={{ maxHeight: `${height}px` }}
        preserveAspectRatio="xMidYMid meet"
        shapeRendering="crispEdges"
      >
        <rect width={totalWidth} height={totalSvgHeight} fill="#FFFFFF" />
        {bars.map((bar, idx) => (
          <rect
            key={idx}
            x={bar.x}
            y={2}
            width={bar.width}
            height={barHeight}
            fill="#000000"
          />
        ))}
        {showText && (
          <text
            x={totalWidth / 2}
            y={barHeight + 12}
            textAnchor="middle"
            fontFamily="monospace"
            fontSize={textSize}
            fontWeight="bold"
            letterSpacing="2px"
            fill="#000000"
          >
            {validText}
          </text>
        )}
      </svg>
    </div>
  );
}

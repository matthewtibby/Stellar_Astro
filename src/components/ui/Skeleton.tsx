import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}

const Skeleton: React.FC<SkeletonProps> = ({ width, height, borderRadius, className = '', style, ...props }) => {
  return (
    <div
      className={`animate-pulse bg-gray-700/60 ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
      {...props}
    />
  );
};

export default Skeleton; 
"use client";
import React from "react";
import {
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { useRef } from "react";

export function MovingBorderButton({
  borderRadius = "1.75rem",
  children,
  duration = 3000,
  className,
  onClick,
  ...otherProps
}: {
  borderRadius?: string;
  children: React.ReactNode;
  duration?: number;
  className?: string;
  onClick?: () => void;
  [key: string]: any;
}) {
  return (
    <button
      className={`relative overflow-hidden bg-transparent p-[1px] text-xl ${className || ''}`}
      style={{
        borderRadius: borderRadius,
      }}
      onClick={onClick}
      {...otherProps}
    >
      <div
        className="absolute inset-0"
        style={{ borderRadius: `calc(${borderRadius} * 0.96)` }}
      >
        <MovingBorder duration={duration} rx="30%" ry="30%">
          <div
            className="h-20 w-20 bg-[radial-gradient(circle,#06b6d4_40%,transparent_60%)] opacity-100"
          />
        </MovingBorder>
      </div>

      <div
        className="relative flex h-full w-full items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 px-8 py-3 text-base font-medium text-neutral-50 antialiased backdrop-blur-xl shadow-lg hover:from-sky-400 hover:to-indigo-500 transition-all duration-300"
        style={{
          borderRadius: `calc(${borderRadius} * 0.96)`,
        }}
      >
        {children}
      </div>
    </button>
  );
}

export const MovingBorder = ({
  children,
  duration = 3000,
  rx,
  ry,
  ...otherProps
}: {
  children: React.ReactNode;
  duration?: number;
  rx?: string;
  ry?: string;
  [key: string]: any;
}) => {
  const pathRef = useRef<SVGRectElement>(null);
  const progress = useMotionValue<number>(0);

  useAnimationFrame((time) => {
    const length = pathRef.current?.getTotalLength();
    if (length) {
      const pxPerMillisecond = length / duration;
      progress.set((time * pxPerMillisecond) % length);
    }
  });

  const x = useTransform(
    progress,
    (val) => {
      if (pathRef.current) {
        try {
          const point = pathRef.current.getPointAtLength(val);
          return point ? point.x : 0;
        } catch (e) {
          return 0;
        }
      }
      return 0;
    }
  );
  const y = useTransform(
    progress,
    (val) => {
      if (pathRef.current) {
        try {
          const point = pathRef.current.getPointAtLength(val);
          return point ? point.y : 0;
        } catch (e) {
          return 0;
        }
      }
      return 0;
    }
  );

  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`;

  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="absolute h-full w-full"
        width="100%"
        height="100%"
        {...otherProps}
      >
        <rect
          fill="none"
          width="100%"
          height="100%"
          rx={rx}
          ry={ry}
          ref={pathRef}
        />
      </svg>
      <motion.div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          display: "inline-block",
          transform,
        }}
      >
        {children}
      </motion.div>
    </>
  );
};

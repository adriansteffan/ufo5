import { useMotionValue, MotionValue } from 'motion/react';
import { useRef, useCallback, useState } from 'react';

interface ScaledDragResult {
  x: MotionValue<number>;
  y: MotionValue<number>;
  isDragging: boolean;
  handlers: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
  };
}

export const useScaledDrag = (
  enabled: boolean,
  onDrag?: (info: { point: { x: number; y: number } }) => void,
  onDragEnd?: (info: { point: { x: number; y: number } }) => void,
): ScaledDragResult => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef({ pointerX: 0, pointerY: 0 });
  const currentPoint = useRef({ x: 0, y: 0 });

  const getScale = () => {
    const style = getComputedStyle(document.documentElement);
    return parseFloat(style.getPropertyValue('--scale-factor')) || 1;
  };

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled) return;
      setIsDragging(true);
      startPos.current = { pointerX: e.clientX, pointerY: e.clientY };
      currentPoint.current = { x: e.clientX, y: e.clientY };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [enabled],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const scale = getScale();
      const dx = (e.clientX - startPos.current.pointerX) / scale;
      const dy = (e.clientY - startPos.current.pointerY) / scale;
      x.set(dx);
      y.set(dy);
      currentPoint.current = { x: e.clientX, y: e.clientY };
      onDrag?.({ point: currentPoint.current });
    },
    [isDragging, x, y, onDrag],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      setIsDragging(false);
      onDragEnd?.({ point: currentPoint.current });
      x.set(0);
      y.set(0);
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    },
    [isDragging, x, y, onDragEnd],
  );

  return {
    x,
    y,
    isDragging,
    handlers: { onPointerDown, onPointerMove, onPointerUp },
  };
};

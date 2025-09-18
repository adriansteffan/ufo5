import { useEffect, useState, useRef } from 'react';
import { BaseComponentProps } from '@adriansteffan/reactive';

const FONT_FAMILY = 'sans-serif';

interface WheelComponentProps {
  segments: string[];
  segColors: string[];
  winningSegment: string;
  buttonText?: string;
  nextText?: string;
  size?: number;
  fontSize?: string;
  outlineWidth?: number;
}

export const WheelOfFortune = ({
  segments,
  segColors,
  winningSegment,
  buttonText = 'Spin',
  nextText = 'Continue',
  size = window.innerWidth,
  fontSize = '1.2em',
  next,
}: WheelComponentProps & BaseComponentProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const dimension = (size + 20) * 2;
  const [isFinished, setFinished] = useState(false);
  const [statusText, setStatusText] = useState('Spin the wheel and let it pick a game for you!');
  let timerHandle = 0;
  let angleCurrent = 0;
  let canvasContext: CanvasRenderingContext2D | null = null;
  const centerX = size + 20;
  const centerY = size + 20;
  useEffect(() => {
    wheelInit();
    setTimeout(() => {
      window.scrollTo(0, 1);
    }, 0);
  }, []);

  const wheelInit = () => {
    initCanvas();
    draw();
  };

  const initCanvas = () => {
    let canvas = canvasRef.current;

    if (navigator.userAgent.indexOf('MSIE') !== -1) {
      canvas = document.createElement('canvas');
      canvas.setAttribute('width', `${dimension}`);
      canvas.setAttribute('height', `${dimension}`);
      wheelRef.current?.appendChild(canvas);
    }

    if (canvas) {
      // Fix high DPI scaling
      const ctx = canvas.getContext('2d');
      const ratio = window.devicePixelRatio || 1;
      canvas.width = dimension * ratio;
      canvas.height = dimension * ratio;
      canvas.style.width = dimension + 'px';
      canvas.style.height = dimension + 'px';
      ctx?.scale(ratio, ratio);

      canvas.addEventListener('click', spin, false);
      canvasContext = ctx;
    }
  };

  const spin = () => {
    if (timerHandle === 0) {
      // 1. Calculate the angle of the winning segment's center.
      const winningSegmentIndex = segments.indexOf(winningSegment);
      const segmentAngle = (Math.PI * 2) / segments.length;
      const winningSegmentCenterAngle = winningSegmentIndex * segmentAngle + segmentAngle / 2;

      // 2. The needle points to -Math.PI / 2. We need to find the difference
      //    to align the winning segment center with the needle's position.
      const needleOffset = -Math.PI / 2;
      let angleToWin = Math.PI * 2 - winningSegmentCenterAngle + needleOffset;

      // 3. To make it spin, add several full rotations.
      const fullRotations = Math.PI * 2 * 5;
      let finalAngle = fullRotations + angleToWin;

      const spinDuration = 5000;
      const startTimestamp = performance.now();

      const animateSpin = (currentTime) => {
        const elapsed = currentTime - startTimestamp;
        let progress = elapsed / spinDuration;

        if (progress >= 1) {
          // Animation is complete
          angleCurrent = finalAngle;
          draw();
          setFinished(true);
          setStatusText(`You will be playing ${winningSegment}!`);
          return;
        }

        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
        progress = easeOutCubic(progress);

        angleCurrent = finalAngle * progress;

        draw();
        window.requestAnimationFrame(animateSpin);
      };

      window.requestAnimationFrame(animateSpin);
    }
  };

  const draw = () => {
    clear();
    drawShadow();
    drawWheel();
    drawNeedle();
  };

  const drawSegment = (key: number, lastAngle: number, angle: number) => {
    if (!canvasContext) {
      return false;
    }
    const ctx = canvasContext;
    const value = segments[key];
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, size, lastAngle, angle, false);
    ctx.lineTo(centerX, centerY);
    ctx.closePath();
    ctx.fillStyle = segColors[key % segColors.length];
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'black';
    ctx.stroke();
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((lastAngle + angle) / 2);
    ctx.fillStyle = 'black';
    ctx.font = `bold ${fontSize} ${FONT_FAMILY}`;
    ctx.fillText(value.substring(0, 21), size / 2 + 20, 0);
    ctx.restore();
  };

  const drawWheel = () => {
    if (!canvasContext) {
      return false;
    }
    const ctx = canvasContext;
    let lastAngle = angleCurrent;
    const len = segments.length;
    const PI2 = Math.PI * 2;
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'black';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.font = '1em ' + FONT_FAMILY;
    for (let i = 1; i <= len; i++) {
      const angle = PI2 * (i / len) + angleCurrent;
      drawSegment(i - 1, lastAngle, angle);
      lastAngle = angle;
    }

    // center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 50, 0, PI2, false);
    ctx.closePath();
    ctx.fillStyle = 'white';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'black';
    ctx.fill();
    ctx.font = 'bold 1em ' + FONT_FAMILY;
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.fillText(buttonText, centerX, centerY + 3);
    ctx.stroke();

    // outer circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, size, 0, PI2, false);
    ctx.closePath();

    ctx.lineWidth = 6;
    ctx.strokeStyle = 'black';
    ctx.stroke();
  };

  const drawShadow = () => {
    if (!canvasContext) {
      return false;
    }
    const ctx = canvasContext;
    const shadowOffset = 8;

    // shadow for outer circle
    ctx.beginPath();
    ctx.arc(centerX + shadowOffset, centerY + shadowOffset, size, 0, Math.PI * 2, false);
    ctx.closePath();
    ctx.fillStyle = 'black';
    ctx.fill();

    // shadow for center circle
    ctx.beginPath();
    ctx.arc(centerX + shadowOffset, centerY + shadowOffset, 50, 0, Math.PI * 2, false);
    ctx.closePath();
    ctx.fillStyle = 'black';
    ctx.fill();
  };

  const drawNeedle = () => {
    if (!canvasContext) {
      return false;
    }
    const ctx = canvasContext;
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'black';
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.moveTo(centerX + 15, centerY - 50);
    ctx.lineTo(centerX - 15, centerY - 50);
    ctx.lineTo(centerX, centerY - 70);
    ctx.closePath();
    ctx.fill();
  };

  const clear = () => {
    if (!canvasContext) {
      return false;
    }
    const ctx = canvasContext;
    ctx.clearRect(0, 0, dimension, dimension);
  };

  return (
    <div className='flex flex-col items-center gap-12 min-h-screen pt-20 bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]'>
      <div className='text-3xl font-bold text-center'>{statusText}</div>
      <div ref={wheelRef}>
        <canvas
          ref={canvasRef}
          width={dimension}
          height={dimension}
          className="cursor-pointer"
          style={{
            pointerEvents: isFinished ? 'none' : 'auto',
          }}
        />
      </div>
      <div className='h-12 flex items-center'>
        {isFinished && (
          <button
            onClick={() => next()}
            className='bg-white cursor-pointer px-8 py-3 border-2 border-black font-bold text-black text-lg rounded-xl shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none'
          >
            {nextText}
          </button>
        )}
      </div>
    </div>
  );
};

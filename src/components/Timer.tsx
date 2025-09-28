import React, { useEffect, useState } from 'react';

interface TimerProps {
  timelimit: number;
  roundOver: boolean;
  onEnd: () => void;
  className?: string;
}

export const Timer = React.memo(({ timelimit, roundOver, onEnd, className = '' }: TimerProps) => {
  const [timeLeft, setTimeLeft] = useState(timelimit);

  useEffect(() => {
    if (roundOver || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [roundOver, timeLeft]);

  // Handle timer end separately to avoid setState during render issues
  useEffect(() => {
    if (timeLeft === 0 && !roundOver) {
      onEnd();
    }
  }, [timeLeft, roundOver, onEnd]);

  return (
    <div className={`p-2 pt-4 flex justify-center ${className}`}>
      <div className='text-2xl font-bold text-center'>
        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
      </div>
    </div>
  );
});
import { useState, useCallback, useRef, useEffect } from 'react';

type TimeoutState = 'playing' | 'popup' | 'grace' | 'ended';

interface UseGracefulTimeoutOptions {
  enabled: boolean;
  onGameEnd: () => void;
}

interface UseGracefulTimeoutReturn {
  timeoutState: TimeoutState;
  handleTimerEnd: () => void;
  handlePopupContinue: () => void;
  handlePopupEnd: () => void;
  handleMoveComplete: () => void;
  showPopup: boolean;
  isGracePeriod: boolean;
  isGameEnded: boolean;
}

export const useGracefulTimeout = ({
  enabled,
  onGameEnd,
}: UseGracefulTimeoutOptions): UseGracefulTimeoutReturn => {
  const [timeoutState, setTimeoutState] = useState<TimeoutState>('playing');

  // Use ref to avoid stale closure issues with onGameEnd
  const onGameEndRef = useRef(onGameEnd);
  useEffect(() => {
    onGameEndRef.current = onGameEnd;
  }, [onGameEnd]);

  // Called when the timer reaches 0
  const handleTimerEnd = useCallback(() => {
    if (enabled) {
      // Show popup to ask if user wants to continue
      setTimeoutState('popup');
    } else {
      // Feature disabled - end game immediately
      setTimeoutState('ended');
      onGameEndRef.current();
    }
  }, [enabled]);

  // Called when user clicks "Yes" on the popup
  const handlePopupContinue = useCallback(() => {
    setTimeoutState('grace');
  }, []);

  // Called when user clicks "No" on the popup
  const handlePopupEnd = useCallback(() => {
    setTimeoutState('ended');
    onGameEndRef.current();
  }, []);

  // Called after a successful move during grace period
  // Just transition to 'ended' state - let user click END button to call onGameEnd
  const handleMoveComplete = useCallback(() => {
    if (timeoutState === 'grace') {
      setTimeoutState('ended');
    }
  }, [timeoutState]);

  return {
    timeoutState,
    handleTimerEnd,
    handlePopupContinue,
    handlePopupEnd,
    handleMoveComplete,
    showPopup: timeoutState === 'popup',
    isGracePeriod: timeoutState === 'grace',
    isGameEnded: timeoutState === 'ended',
  };
};

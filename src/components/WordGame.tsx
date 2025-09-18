import { useEffect, useRef, useState, useMemo } from 'react';
import { LETTER_SETS } from '../utils/wordgamelist';
import { BaseComponentProps, now, toast, Bounce } from '@adriansteffan/reactive';
import { motion, AnimatePresence } from 'motion/react';

interface WordObj {
  word: string;
  isCorrect: boolean;
  submitTime: number;
}

interface WordGameProps extends BaseComponentProps {
  timelimit: number;
  showCorrectness?: boolean;
}

interface ActionData {
  actionIndex: number;
  button: string;
  timestamp: number;
}

interface WordData {
  foundWordIndex: number;
  word: string | null;
  isCorrect: boolean | null;
  submitTime: number | null;
  actions: ActionData[];
}

type WordGameData = {
  roundIndex: number;
  letters: string;
  starttime: number;
  found: WordData[];
}[];

export const WordGame = ({ next, timelimit, showCorrectness = true }: WordGameProps) => {
  const initialSet = useMemo(() => {
    const set = LETTER_SETS.sample()[0];
    return {
      ...set,
      letters: [...set.letters].shuffle()
    };
  }, []);
  const [currentLetterSet, setCurrentLetterSet] = useState(initialSet);
  const [data, setData] = useState<WordGameData>(() => [
    {
      roundIndex: 0,
      letters: initialSet.letters.join(''),
      found: [] as WordData[],
      starttime: now(),
    },
  ]);

  const [currentActionList, setCurrentActionList] = useState<ActionData[]>([]);
  const [currentWord, setCurrentWord] = useState('');
  const [foundWords, setFoundWords] = useState<WordObj[]>([]);
  const [timeLeft, setTimeLeft] = useState(timelimit);
  const [roundOver, setRoundOver] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const wordsContainerRef = useRef<HTMLDivElement>(null);

  const LetterButton = ({ letter }: { letter: string }) => (
    <button
      className={`w-20 h-20 rounded-full bg-yellow-300 hover:bg-yellow-400 border-2 border-black font-bold text-2xl shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none disabled:opacity-50 cursor-pointer select-none`}
      onClick={() => !roundOver && handleLetterClick(letter)}
      disabled={roundOver}
      tabIndex={-1}
    >
      {letter}
    </button>
  );

  const ControlButton = ({
    onClick,
    disabled = false,
    className = '',
    children,
  }: {
    onClick: () => void;
    disabled?: boolean;
    className?: string;
    children: React.ReactNode;
  }) => (
    <button
      className={`cursor-pointer bg-white w-32 border-2 border-black font-bold rounded-full shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none disabled:opacity-50 select-none ${className}`}
      onClick={onClick}
      disabled={disabled}
      tabIndex={-1}
    >
      {children}
    </button>
  );

  // Timer
  useEffect(() => {
    if (roundOver) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = Math.max(0, prev - 1);

        if (newTime === 0 && !roundOver) {
          setRoundOver(true);
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [roundOver]);

  // Scroll the words to the bottom as soon as a new one is added
  useEffect(() => {
    if (wordsContainerRef.current) {
      wordsContainerRef.current.scrollTop = wordsContainerRef.current.scrollHeight;
    }
  }, [foundWords]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (roundOver) return;

      if (event.key === 'Enter') {
        event.preventDefault();
        handleSubmitWord();
      } else if (event.key === 'Backspace') {
        event.preventDefault();
        handleBackspace();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [roundOver, currentWord, foundWords, currentLetterSet]);

  const handleLetterClick = (letter: string) => {
    if (roundOver) return;
    if (currentWord.length >= 20) {
      toast('Word cannot be longer than 20 letters!', {
        position: 'top-center',
        transition: Bounce,
        autoClose: 2000,
      });
      return;
    }
    pushAction(letter);
    setCurrentWord((prev) => prev + letter);
  };

  const pushAction = (button: string) => {
    setCurrentActionList((prev) => [
      ...prev,
      { actionIndex: prev.length, button: button, timestamp: now() },
    ]);
  };

  const handleBackspace = () => {
    if (roundOver) return;
    pushAction('BACKSPACE');
    setCurrentWord((prev) => prev.slice(0, -1));
  };

  const handleSubmitWord = () => {
    if (roundOver) return;
    if (currentWord.length === 0) return;

    if (foundWords.some((w) => w.word === currentWord)) {
      toast('Word already found!', {
        position: 'top-center',
        transition: Bounce,
        autoClose: 2000,
      });
      return;
    }

    const canMakeWord = currentWord
      .split('')
      .every((letter) => currentLetterSet.letters.includes(letter));

    if (!canMakeWord) {
      toast('Word uses letters not available!', {
        position: 'top-center',
        transition: Bounce,
        autoClose: 2000,
      });
      return;
    }

    const wordData: WordObj = {
      word: currentWord,
      isCorrect: currentLetterSet.validWords.includes(currentWord),
      submitTime: now(),
    };

    setFoundWords((prev) => [...prev, wordData]);
    setCurrentWord('');

    setData((prev) => {
      const updatedData = [...prev];
      const currentRound = prev[prev.length - 1];
      currentRound.found.push({
        foundWordIndex: currentRound.found.length,
        actions: currentActionList,
        ...wordData,
      });
      return updatedData;
    });

    setCurrentActionList([]);
  };

  const handleNewLetterSet = () => {
    if (roundOver) return;

    // prevent duplicates
    const availableSets = LETTER_SETS.filter((set) => set.letters !== currentLetterSet.letters);
    const selectedSet = availableSets.sample()[0];
    const newLetterSet = {
      ...selectedSet,
      letters: [...selectedSet.letters].shuffle()
    };
    setData((prev) => [
      ...prev,
      {
        roundIndex: prev.length,
        letters: newLetterSet.letters.join(''),
        found: [] as WordData[],
        starttime: now(),
      },
    ]);
    setCurrentLetterSet(newLetterSet);
    setCurrentWord('');
    setFoundWords([]);
  };

  const handleNext = () => {
    const finalData = [...data];
    const currentRound = finalData[finalData.length - 1];
    currentRound.found.push({
      foundWordIndex: currentRound.found.length,
      actions: currentActionList,
      word: null,
      isCorrect: null,
      submitTime: null,
    });

    next(finalData);
  };

  return (
    <div className='min-h-screen w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]'>
      <div className='p-4 pt-8 pb-10 lg:pt-24 max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 justify-center lg:min-h-screen'>
        {/* Left Side - Timer */}
        <div className='lg:w-56 lg:px-12 lg:p-4 flex flex-col items-center gap-4'>
          <div className='text-2xl font-bold text-center'>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>

          {/* CLEAR and NEW SET buttons in the horizontal layout */}
          {!roundOver && (
            <div className='hidden lg:flex flex-col gap-4 items-center'>
              <ControlButton
                onClick={() => {
                  pushAction('CLEAR');
                  setCurrentWord('');
                }}
                className='px-6 py-3 text-sm sm:text-base'
              >
                CLEAR
              </ControlButton>
              <ControlButton
                onClick={handleNewLetterSet}
                className='px-4 py-3 text-sm sm:text-base'
              >
                NEW SET
              </ControlButton>
              <ControlButton
                onClick={() => {
                  pushAction('HELP');
                  setShowHelp(true);
                }}
                className='px-6 py-3 text-sm sm:text-base'
              >
                HELP
              </ControlButton>
            </div>
          )}
        </div>

        {/* Center - Game Board */}
        <div className='flex flex-col flex-1 items-center justify-center lg:justify-between'>
          <div className='space-y-8 flex flex-col items-center'>
            {/* Current Word */}
            <div className='min-h-[60px] flex items-center'>
              <div className='text-4xl font-bold tracking-wider min-w-[200px] text-center'>
                {currentWord || (roundOver ? "TIME'S UP!" : '')}
                {!roundOver && (
                  <span
                    className='inline-block'
                    style={{
                      animation: 'blink 2s infinite',
                      verticalAlign: 'top',
                      lineHeight: '1',
                    }}
                  >
                    |
                  </span>
                )}
              </div>
            </div>

            <style>{`
              @keyframes blink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0; }
              }
            `}</style>

            {/* Letter Buttons*/}
            <div className='flex flex-col items-center gap-2'>
              {/* Top row - 2 buttons */}
              <div className='flex gap-6'>
                <LetterButton letter={currentLetterSet.letters[1]} />
                <LetterButton letter={currentLetterSet.letters[2]} />
              </div>

              {/* Middle row - 3 buttons */}
              <div className='flex gap-6'>
                <LetterButton letter={currentLetterSet.letters[3]} />
                <LetterButton letter={currentLetterSet.letters[0]} />
                <LetterButton letter={currentLetterSet.letters[4]} />
              </div>

              {/* Bottom row - 2 buttons */}
              <div className='flex gap-6'>
                <LetterButton letter={currentLetterSet.letters[5]} />
                <LetterButton letter={currentLetterSet.letters[6]} />
              </div>
            </div>

            {/* Control Buttons */}
            <div className='mt-4'>
              {!roundOver && (
                <>
                  {/* Top row - ⌫ DELETE and ENTER */}
                  <div className='flex gap-4 justify-center mb-4'>
                    <ControlButton
                      onClick={handleBackspace}
                      disabled={roundOver || currentWord.length === 0}
                      className='py-3 text-sm md:text-lg'
                    >
                      DELETE
                    </ControlButton>
                    <ControlButton
                      onClick={handleSubmitWord}
                      disabled={currentWord.length === 0}
                      className='py-3 text-sm md:text-lg'
                    >
                      ENTER
                    </ControlButton>
                  </div>

                  {/* Bottom row - CLEAR and NEW SET - responsive layout */}
                  <div className='flex gap-4 justify-center lg:hidden'>
                    <ControlButton
                      onClick={() => setCurrentWord('')}
                      className='px-6 py-3 text-sm md:text-lg'
                    >
                      CLEAR
                    </ControlButton>
                    <ControlButton
                      onClick={handleNewLetterSet}
                      className='px-4 py-3 text-xs sm:text-sm md:text-lg'
                    >
                      NEW SET
                    </ControlButton>
                  </div>
                </>
              )}
              {roundOver && (
                <div className='flex justify-center'>
                  <ControlButton onClick={handleNext} className='px-6 py-3 text-lg'>
                    END
                  </ControlButton>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Found Words */}
        <div className='mx-auto w-4/5 sm:w-3/5 mt-5 lg:mt-0 lg:w-64 flex flex-col'>
          <div className='h-0'></div>
          <div
            ref={wordsContainerRef}
            className='border-4 border-black bg-white p-4 min-h-128 overflow-y-auto space-y-2'
          >
            {foundWords.map((wordData, index) => (
              <div key={index} className='p-2 text-center font-bold'>
                {wordData.word}
                {showCorrectness && <span className='ml-2'>{wordData.isCorrect ? '✓' : '✗'}</span>}
              </div>
            ))}
            {foundWords.length === 0 && (
              <div className='text-gray-500 text-center italic'>No words found yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Help Popup */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50'
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className='bg-white border-4 border-black rounded-lg shadow-[5px_5px_0px_rgba(0,0,0,1)] p-6 max-w-md mx-4'
              onClick={(e) => e.stopPropagation()}
            >
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-xl font-bold'>How to Play</h3>
                <button
                  onClick={() => setShowHelp(false)}
                  className='w-8 h-8 rounded-full bg-red-300 border-2 border-black flex items-center justify-center font-bold text-lg hover:bg-red-400 leading-none'
                >
                  ×
                </button>
              </div>
              <div className='mb-4'>
                <p className='mb-3'>
                  <strong>Goal:</strong> Create as many valid words as possible using the given set
                  of 7 letters.
                </p>
                <p className='mb-2'>
                  <strong>Controls:</strong>
                </p>
                <ul className='text-sm space-y-1 mb-3 pl-4'>
                  <li>• Click letter buttons to spell words</li>
                  <li>• Press ENTER to submit a word</li>
                  <li>• Press DELETE to remove last letter</li>
                  <li>• Press CLEAR to delete the full current input</li>
                  <li>• Press NEW SET for different letters</li>
                </ul>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className='w-full cursor-pointer bg-white px-4 py-2 border-2 border-black font-bold text-black rounded-lg shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all duration-150'
              >
                Got it!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

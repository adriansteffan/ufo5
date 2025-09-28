import { useEffect, useRef, useState, useMemo } from 'react';
import { NUMBER_SETS } from '../utils/numbergamelist';
import { BaseComponentProps, now, toast, Bounce } from '@adriansteffan/reactive';
import { HelpModal } from './HelpModal';
import { Timer } from './Timer';

interface ExpressionObj {
  expression: string;
  result: number;
  submitTime: number;
}

interface ActionData {
  actionIndex: number;
  button: string;
  timestamp: number;
}

interface ExpressionData {
  foundExpressionIndex: number;
  expression: string | null;
  result: number | null;
  submitTime: number | null;
  actions: ActionData[];
}

type NumberGameData = {
  roundIndex: number;
  numbers: string;
  target: number;
  starttime: number;
  found: ExpressionData[];
}[];

export const NumberGame = ({ next, timelimit }: {timelimit: number} & BaseComponentProps) => {
  const initialSet = useMemo(() => {
    const set = NUMBER_SETS.sample()[0];
    return {
      ...set,
      numbers: [...set.numbers].shuffle(),
    };
  }, []);

  const [currentNumberSet, setCurrentNumberSet] = useState(initialSet);
  const [data, setData] = useState<NumberGameData>(() => [
    {
      roundIndex: 0,
      numbers: [...initialSet.numbers].sort((a, b) => a - b).join(','),
      target: initialSet.target,
      found: [] as ExpressionData[],
      starttime: now(),
    },
  ]);

  const [currentActionList, setCurrentActionList] = useState<ActionData[]>([]);
  const [currentExpression, setCurrentExpression] = useState('');
  const [foundExpressions, setFoundExpressions] = useState<ExpressionObj[]>([]);
  const [roundOver, setRoundOver] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [expectingOperator, setExpectingOperator] = useState(false);

  const expressionsContainerRef = useRef<HTMLDivElement>(null);
  const formulaDisplayRef = useRef<HTMLDivElement>(null);

  const isOperator = (value: string): boolean => {
    return ['+', '-', '*', '/'].includes(value);
  };

  const getDisplayOperator = (operator: string): string => {
    switch (operator) {
      case '*': return '×';
      case '/': return '÷';
      default: return operator;
    }
  };

  const convertOperatorsForDisplay = (expression: string): string => {
    return expression.replace(/\*/g, '×').replace(/\//g, '÷');
  };

  const pushAction = (button: string) => {
    const action: ActionData = {
      actionIndex: currentActionList.length,
      button,
      timestamp: now(),
    };
    setCurrentActionList((prev) => [...prev, action]);
  };

  const ControlButton = ({
    children,
    onClick,
    disabled = false,
    className = '',
  }: {
    children: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    className?: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`cursor-pointer bg-white w-32 border-2 border-black font-bold text-black rounded-full shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none disabled:opacity-50 disabled:cursor-not-allowed select-none ${className}`}
    >
      {children}
    </button>
  );

  const NumberButton = ({ number }: { number: number }) => (
    <button
      className='w-20 h-20 rounded-lg bg-red-400 hover:bg-red-500 border-2 border-black font-bold text-3xl text-white shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none disabled:opacity-50 cursor-pointer select-none'
      onClick={() => !roundOver && handleButtonClick(number.toString())}
      disabled={roundOver || expectingOperator}
    >
      {number}
    </button>
  );

  const OperatorButton = ({ operator, color }: { operator: string; color: string }) => (
    <button
      className={`w-16 h-16 rounded-full ${color} hover:opacity-80 border-2 border-black font-bold text-2xl text-white shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none disabled:opacity-50 cursor-pointer select-none`}
      onClick={() => !roundOver && handleButtonClick(operator)}
      disabled={roundOver || !expectingOperator}
    >
      {getDisplayOperator(operator)}
    </button>
  );

  // Left-to-right expression evaluation (avoids NaN when ending with operator)
  const evaluateExpression = (expression: string): number => {
    const tokens = expression.match(/\d+|[+\-*/]/g) || [];
    if (tokens.length === 0) return 0;

    let result = parseFloat(tokens[0] || '0');

    for (let i = 1; i < tokens.length; i += 2) {
      const operator = tokens[i];
      const operand = tokens[i + 1];

      // If we don't have an operand (expression ends with operator), return result of expression up to that point
      if (operand === undefined) {
        break;
      }

      const operandValue = parseFloat(operand);

      switch (operator) {
        case '+':
          result += operandValue;
          break;
        case '-':
          result -= operandValue;
          break;
        case '*':
          result *= operandValue;
          break;
        case '/':
          result /= operandValue;
          break;
      }
    }

    return Math.round(result * 100) / 100;
  };

  const getDynamicFontSize = (expression: string): string => {
    const tokens = expression.match(/\d+|[+\-*/]/g) || [];
    return tokens.length >= 11 ? (tokens.length >= 13 ? 'text-2xl' : 'text-3xl') : 'text-4xl';
  };

  const renderExpression = (expression: string): React.ReactNode => {
    const tokens = expression.match(/\d+|[+\-*/]/g) || [];
    if (tokens.length <= 3) return convertOperatorsForDisplay(expression); // No need for parentheses if only one operation

    let result: React.ReactNode = tokens[0]; // Start with first number

    for (let i = 1; i < tokens.length; i += 2) {
      const operator = tokens[i];
      const operand = tokens[i + 1]; // can be undefined, handled below

      // Replace operators for display
      const displayOperator = getDisplayOperator(operator);

      if (i === 1) {
        // First operation, no parentheses needed yet
        result = (
          <>
            {result} {displayOperator} {operand}
          </>
        );
      } else {
        // Wrap previous result in parentheses and continue
        result = (
          <>
            <span className='text-gray-300'>(</span>
            {result}
            <span className='text-gray-300'>)</span> {displayOperator} {operand || ''}
          </>
        );
      }
    }

    return result || '';
  };

  const handleButtonClick = (value: string) => {
    if (roundOver) return;

    const valueIsOperator = isOperator(value);

    if (valueIsOperator && !expectingOperator) return;
    if (!valueIsOperator && expectingOperator) return;

    pushAction(value);
    setCurrentExpression((prev) => prev + value);
    setExpectingOperator(!valueIsOperator);
  };

  const handleDelete = () => {
    if (roundOver) return;
    if (currentExpression.length === 0) return;

    pushAction('DELETE');

    setCurrentExpression((prev) => {
      const newExpression = prev.slice(0, -1);

      if (newExpression.length === 0) {
        setExpectingOperator(false);
      } else {
        const lastChar = newExpression[newExpression.length - 1];
        const isLastCharOperator = isOperator(lastChar);
        setExpectingOperator(!isLastCharOperator); // If last char is operator, expect number; if number, expect operator
      }

      return newExpression;
    });
  };

  const handleSubmitExpression = () => {
    if (roundOver) return;
    if (currentExpression.length === 0) return;
    if (!expectingOperator) return; // Can only submit after a number

    const result = evaluateExpression(currentExpression);

    if (result !== currentNumberSet.target) {
      toast('Calculation must equal the target!', {
        position: 'top-center',
        transition: Bounce,
        autoClose: 2000,
      });
      return;
    }

    if (foundExpressions.some((expr) => expr.expression === currentExpression)) {
      toast('You already found this way of solving it!', {
        position: 'top-center',
        transition: Bounce,
        autoClose: 2000,
      });
      return;
    }

    const expressionData: ExpressionObj = {
      expression: currentExpression,
      result,
      submitTime: now(),
    };

    setFoundExpressions((prev) => [...prev, expressionData]);
    setCurrentExpression('');
    setExpectingOperator(false);

    setData((prev) => {
      const updatedData = [...prev];
      const currentRound = prev[prev.length - 1];
      currentRound.found.push({
        foundExpressionIndex: currentRound.found.length,
        actions: currentActionList,
        ...expressionData,
      });
      return updatedData;
    });

    setCurrentActionList([]);
  };

  const handleNewNumberSet = () => {
    if (roundOver) return;

    // prevent getting the same one twice in a row
    const availableSets = NUMBER_SETS.filter(
      (set) =>
        JSON.stringify(set.numbers.sort()) !== JSON.stringify(currentNumberSet.numbers.sort()),
    );
    const selectedSet = availableSets.sample()[0];
    const newNumberSet = {
      ...selectedSet,
      numbers: [...selectedSet.numbers].shuffle(),
    };

    setData((prev) => [
      ...prev,
      {
        roundIndex: prev.length,
        numbers: [...selectedSet.numbers].sort((a, b) => a - b).join(','),
        target: selectedSet.target,
        found: [] as ExpressionData[],
        starttime: now(),
      },
    ]);
    setCurrentNumberSet(newNumberSet);
    setCurrentExpression('');
    setFoundExpressions([]);
    setExpectingOperator(false);
  };

  const handleNext = () => {
    const finalData = [...data];
    const currentRound = finalData[finalData.length - 1];
    currentRound.found.push({
      foundExpressionIndex: currentRound.found.length,
      actions: currentActionList,
      expression: null,
      result: null,
      submitTime: null,
    });

    next({ numbersData: finalData, completed: true });
  };

  // Auto-scroll formula display and expression collection
  useEffect(() => {
    if (expressionsContainerRef.current) {
      expressionsContainerRef.current.scrollTop = expressionsContainerRef.current.scrollHeight;
    }
  }, [foundExpressions]);
  useEffect(() => {
    if (formulaDisplayRef.current) {
      formulaDisplayRef.current.scrollLeft = formulaDisplayRef.current.scrollWidth;
    }
  }, [currentExpression]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (roundOver) return;

      if (event.key === 'Enter') {
        event.preventDefault();
        handleSubmitExpression();
      } else if (event.key === 'Backspace') {
        event.preventDefault();
        handleDelete();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [roundOver, currentExpression, expectingOperator, currentNumberSet]);

  return (
    <div className='min-h-screen w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]'>
      <div className='p-4 pt-8 pb-10 lg:pt-24 max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 justify-center lg:min-h-screen'>
        {/* Left Side - Timer and Controls */}
        <div className='lg:w-56 lg:px-12 lg:p-4 flex flex-col items-center gap-4'>
          <Timer
            timelimit={timelimit}
            roundOver={roundOver}
            onEnd={() => setRoundOver(true)}
            className=''
          />
          {/* Control buttons */}
          {!roundOver && (
            <div className='hidden lg:flex flex-col gap-4 items-center'>
              <ControlButton
                onClick={() => {
                  pushAction('CLEAR');
                  setCurrentExpression('');
                  setExpectingOperator(false);
                }}
                className='px-6 py-3 text-sm sm:text-base'
              >
                CLEAR
              </ControlButton>
              <ControlButton
                onClick={handleNewNumberSet}
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

        {/* Center - Game Interface */}
        <div className='flex flex-col flex-1 items-center justify-center lg:justify-between'>
          <div className='space-y-8 flex flex-col items-center'>
            {/* Target Number */}
            <div className='text-2xl font-bold text-center'>Target: {currentNumberSet.target}</div>

            {/* Current Expression and Result */}
            <div className='min-h-[60px] flex items-center justify-center gap-4'>
              <div
                ref={formulaDisplayRef}
                className={`${getDynamicFontSize(currentExpression)} font-bold tracking-wider max-w-[500px] overflow-x-auto text-center px-4 py-2`}
                style={{ scrollbarWidth: 'thin' }}
              >
                <div style={{ whiteSpace: 'nowrap', minWidth: 'max-content' }}>
                  {currentExpression ? (
                    <>
                      {renderExpression(currentExpression)}
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
                    </>
                  ) : roundOver ? (
                    "TIME'S UP!"
                  ) : (
                    !roundOver && (
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
                    )
                  )}
                </div>
              </div>
              {currentExpression && (
                <div className='text-2xl font-bold text-gray-600'>
                  = {evaluateExpression(currentExpression)}
                </div>
              )}
            </div>

            {/* Number and Operator Buttons */}
            <div className='flex flex-col items-center gap-6'>
              {/* Number buttons */}
              <div className='flex flex-col gap-4'>
                <div className='flex gap-6'>
                  <NumberButton number={currentNumberSet.numbers[0]} />
                  <NumberButton number={currentNumberSet.numbers[1]} />
                </div>
                <div className='flex gap-6'>
                  <NumberButton number={currentNumberSet.numbers[2]} />
                  <NumberButton number={currentNumberSet.numbers[3]} />
                </div>
              </div>

              {/* Operator buttons */}
              <div className='flex gap-4'>
                <OperatorButton operator='+' color='bg-yellow-500' />
                <OperatorButton operator='-' color='bg-blue-500' />
                <OperatorButton operator='*' color='bg-orange-500' />
                <OperatorButton operator='/' color='bg-green-500' />
              </div>
            </div>

            {/* Control Buttons */}
            <div className='mt-4'>
              {!roundOver && (
                <>
                  <div className='flex gap-4 justify-center mb-4'>
                    <ControlButton
                      onClick={handleDelete}
                      disabled={currentExpression.length === 0}
                      className='px-6 py-3 text-sm md:text-lg'
                    >
                      DELETE
                    </ControlButton>
                    <ControlButton
                      onClick={handleSubmitExpression}
                      disabled={currentExpression.length === 0 || !expectingOperator}
                      className='px-6 py-3 text-sm md:text-lg'
                    >
                      ENTER
                    </ControlButton>
                  </div>

                  {/* Mobile control buttons */}
                  <div className='flex gap-2 justify-center lg:hidden'>
                    <ControlButton
                      onClick={() => {
                        setCurrentExpression('');
                        setExpectingOperator(false);
                      }}
                      className='px-4 py-3 text-xs sm:text-sm md:text-lg'
                    >
                      CLEAR
                    </ControlButton>
                    <ControlButton
                      onClick={handleNewNumberSet}
                      className='px-3 py-3 text-xs sm:text-sm md:text-lg'
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

        {/* Right Side - Found Expressions */}
        <div className='mx-auto w-4/5 sm:w-3/5 mt-5 lg:mt-0 lg:w-64 flex flex-col'>
          <div className='h-0'></div>
          <div
            ref={expressionsContainerRef}
            className='border-3 border-black bg-white p-4 h-128 overflow-y-auto space-y-2 shadow-[3px_3px_0px_rgba(0,0,0,1)]'
          >
            {foundExpressions.map((exprData, index) => (
              <div key={index} className='p-2 text-center font-bold'>
                <div>{renderExpression(exprData.expression)}</div>
              </div>
            ))}
            {foundExpressions.length === 0 && (
              <div className='text-gray-500 text-center italic mt-4'>No solutions yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Help Modal */}
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)}>
        <p className='mb-3'>
          <strong>Goal:</strong> Create mathematical expressions using the 4 given numbers
          and operators to reach the target number.
        </p>
        <p className='mb-2'>
          <strong>Rules:</strong>
        </p>
        <ul className='text-sm space-y-1 mb-3 pl-4'>
          <li>
            Create terms resulting in the target using the given numbers and operators
          </li>
          <li>• Operations are evaluated left to right, e.g. 5 + 5 x 7 = 70</li>
          <li>• Each number and operator can be used multiple times</li>
          <li>• Press ENTER to submit your solution</li>
          <li>• Press DELETE undo the last operation</li>
          <li>• Press CLEAR to delete the entire current solution</li>
          <li>• Press NEW SET for a new pair of numbers and target</li>
        </ul>
      </HelpModal>

      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

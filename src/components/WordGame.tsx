import { BaseComponentProps } from '@adriansteffan/reactive';

interface WordGameProps extends BaseComponentProps {
  timelimit?: number;
}

export const WordGame = ({ next, timelimit }: WordGameProps) => {
  return (
    <div className="p-8">
      <h2>Word Game (External Timer)</h2>
      {timelimit && <p>Time limit: {timelimit} seconds</p>}
      <button onClick={() => next({ timeLeft: (timelimit || 0) - 10, completed: true })} className="px-4 py-2 bg-green-500 text-white rounded">
        Complete Word Game
      </button>
    </div>
  );
};
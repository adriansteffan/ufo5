import { BaseComponentProps } from '@adriansteffan/reactive';

interface NumberGameProps extends BaseComponentProps {
  timelimit?: number;
}

export const NumberGame = ({ next, timelimit }: NumberGameProps) => {
  return (
    <div className="p-8">
      <h2>Number Game (External Timer)</h2>
      {timelimit && <p>Time limit: {timelimit} seconds</p>}
      <button onClick={() => next({ timeLeft: (timelimit || 0) - 15, completed: true })} className="px-4 py-2 bg-green-500 text-white rounded">
        Complete Number Game
      </button>
    </div>
  );
};
import { BaseComponentProps } from '@adriansteffan/reactive';

export const ElementsGame = ({ next }: BaseComponentProps) => {
  return (
    <div className="p-8">
      <h2>Elements Game</h2>
      <p>This is the elements game</p>
      <button onClick={() => next({ completed: true })} className="px-4 py-2 bg-green-500 text-white rounded">
        Complete Elements Game
      </button>
    </div>
  );
};
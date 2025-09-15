import { BaseComponentProps } from '@adriansteffan/reactive';

export const SportsGame = ({ next }: BaseComponentProps) => {
  return (
    <div className="p-8">
      <h2>Sports Game (Internal Timer)</h2>
      <p>This task also has its own internal timer</p>
      <button onClick={() => next({ completed: true })} className="px-4 py-2 bg-green-500 text-white rounded">
        Complete Sports Game
      </button>
    </div>
  );
};
import { BaseComponentProps } from '@adriansteffan/reactive';

export const DatingGame = ({ next }: BaseComponentProps) => {
  return (
    <div className="p-8">
      <h2>Dating Game (Internal Timer)</h2>
      <p>This task has its own internal timer</p>
      <button onClick={() => next({ completed: true })} className="px-4 py-2 bg-green-500 text-white rounded">
        Complete Dating Game
      </button>
    </div>
  );
};
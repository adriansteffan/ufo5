import { useState } from 'react';
import { BaseComponentProps } from '@adriansteffan/reactive';

interface TaskRankingProps extends BaseComponentProps {
  tasks: string[];
  instruction: string;
}

export const TaskRanking = ({ next, tasks, instruction }: TaskRankingProps) => {
  const [rankings, setRankings] = useState<Record<string, number>>({});

  const handleRankChange = (task: string, rank: number) => {
    setRankings(prev => ({ ...prev, [task]: rank }));
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Task Ranking</h2>
      <p className="mb-6">{instruction}</p>

      {tasks.map(task => (
        <div key={task} className="mb-4">
          <span>{task}: </span>
          <select onChange={(e) => handleRankChange(task, parseInt(e.target.value))}>
            <option value="">Select rank...</option>
            {[1, 2, 3, 4, 5].map(rank => <option key={rank} value={rank}>Rank {rank}</option>)}
          </select>
        </div>
      ))}

      <button onClick={() => next({ rankings })} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
        Continue
      </button>
    </div>
  );
};
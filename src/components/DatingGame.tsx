import { BaseComponentProps } from '@adriansteffan/reactive';

interface DatingGameProps extends BaseComponentProps {
  timelimit?: number;
}

export const DatingGame = ({ next, timelimit }: DatingGameProps) => {
  return (
    <div className='min-h-screen w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]'>
      <div className='flex flex-col items-center justify-center min-h-screen p-8'>
        <div className='bg-white p-8 rounded-lg max-w-md text-center'>
          <h2 className='text-3xl font-bold mb-4'>Matchmaker </h2>
          <p className='text-lg mb-14 text-gray-700'>Not finished yet!</p>
          <button
            onClick={() => next({ timeLeft: (timelimit || 0) - 15, completed: true })}
            className='cursor-pointer bg-white px-8 py-3 border-2 border-black font-bold text-black text-lg rounded-xl shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all duration-150'
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
};
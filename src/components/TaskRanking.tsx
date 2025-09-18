import { useState } from 'react';
import { BaseComponentProps } from '@adriansteffan/reactive';
import { motion, Reorder, AnimatePresence } from 'motion/react';

interface TaskRankingProps extends BaseComponentProps {
  tasks: string[];
  taskNames: Record<string, string>;
  taskDescriptions: Record<string, string>;
}

export const TaskRanking = ({ next, tasks, taskNames, taskDescriptions }: TaskRankingProps) => {
  const [orderedTasks, setOrderedTasks] = useState<string[]>(() => [...tasks].shuffle());
  const [popupTask, setPopupTask] = useState<string | null>(null);

  const handleNext = () => {
    const rankings: Record<string, number> = {};
    orderedTasks.forEach((task, index) => {
      rankings[task] = index + 1;
    });
    next({ rankings });
  };

  const handleQuestionClick = (task: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setPopupTask(task);
  };

  const closePopup = () => {
    setPopupTask(null);
  };

  return (
    <div className='min-h-screen w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]'>
      <div className='p-8 pt-16 max-w-4xl mx-auto flex flex-col gap-4 items-center'>
        <h2 className='text-4xl font-bold mb-6 text-center'>Rank the Games!</h2>
        <p className='mb-8 text-lg max-w-2xl'>
          We want to know how interested you would be in playing these games! Please put them in a
          ranking from most interesting (1) to least interesting ({tasks.length}). <br />
          Simply drag and drop the cards to reorder. If want to read a games description again,
          press the ? icon.
        </p>

        <div className='w-full max-w-2xl'>
          <Reorder.Group
            axis='y'
            values={orderedTasks}
            onReorder={setOrderedTasks}
            className='space-y-4'
          >
            {orderedTasks.map((task, index) => (
              <Reorder.Item key={task} value={task} className='cursor-grab active:cursor-grabbing'>
                <motion.div
                  className='p-4 bg-white border-3 border-black rounded-lg shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_rgba(0,0,0,1)] transition-all duration-150'
                  whileDrag={{
                    scale: 1.02,
                    rotate: 1,
                    boxShadow: '5px 5px 0px rgba(0,0,0,1)',
                    translateX: 0,
                    translateY: 0,
                    zIndex: 1000,
                  }}
                  dragTransition={{
                    bounceStiffness: 300,
                    bounceDamping: 20,
                  }}
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-4'>
                      <div className='w-8 h-8 rounded-full bg-yellow-300 border-2 border-black flex items-center justify-center font-bold text-lg'>
                        {index + 1}
                      </div>
                      <span className='font-semibold text-lg'>{taskNames[task]}</span>
                    </div>
                    <div className='flex items-center gap-10'>
                      <button
                        onClick={(e) => handleQuestionClick(task, e)}
                        className='w-6 h-6 rounded-full bg-white border-2 border-black flex items-center justify-center font-bold text-sm hover:bg-gray-400 cursor-help'
                        title={`Learn more about: ${task}`}
                      >
                        ?
                      </button>
                      <div className='flex items-center justify-center cursor-grab active:cursor-grabbing mr-2'>
                        <div className='flex flex-col gap-0.5'>
                          <div className='flex gap-0.5'>
                            <div className='w-1 h-1 bg-gray-600 rounded-full'></div>
                            <div className='w-1 h-1 bg-gray-600 rounded-full'></div>
                          </div>
                          <div className='flex gap-0.5'>
                            <div className='w-1 h-1 bg-gray-600 rounded-full'></div>
                            <div className='w-1 h-1 bg-gray-600 rounded-full'></div>
                          </div>
                          <div className='flex gap-0.5'>
                            <div className='w-1 h-1 bg-gray-600 rounded-full'></div>
                            <div className='w-1 h-1 bg-gray-600 rounded-full'></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>

        <button
          onClick={handleNext}
          className='mt-8 cursor-pointer bg-white px-8 py-3 border-2 border-black font-bold text-black text-lg rounded-xl shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all duration-150'
        >
          Continue
        </button>
      </div>

      {/* Popup Modal */}
      <AnimatePresence>
        {popupTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50'
            onClick={closePopup}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className='bg-white border-4 border-black rounded-lg shadow-[5px_5px_0px_rgba(0,0,0,1)] p-6 max-w-md mx-4'
              onClick={(e) => e.stopPropagation()}
            >
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-xl font-bold'>Game Description</h3>
                <button
                  onClick={closePopup}
                  className='w-8 h-8 rounded-full bg-red-300 border-2 border-black flex items-center justify-center font-bold text-lg hover:bg-red-400 leading-none'
                >
                  ×
                </button>
              </div>
              <div className='mb-4'>
                <h4 className='font-semibold text-lg mb-2'>{taskNames[popupTask]}</h4>
                <p className='text-gray-700 mb-3'>{taskDescriptions[popupTask]}</p>
              </div>
              <button
                onClick={closePopup}
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

import { useState, useEffect } from 'react';
import { BaseComponentProps } from '@adriansteffan/reactive';
import { motion, AnimatePresence } from 'motion/react';

interface TaskRatingProps extends BaseComponentProps {
  tasks: string[];
  taskNames: Record<string, string>;
  taskDescriptions: Record<string, string>;
}

export const TaskRating = ({ next, tasks, taskNames, taskDescriptions }: TaskRatingProps) => {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [orderedTasks, setOrderedTasks] = useState<string[]>(() => [...tasks].shuffle());
  const [popupTask, setPopupTask] = useState<string | null>(null);

  useEffect(() => {
    // Only sort if there are actual ratings, otherwise preserve random order
    const hasAnyRatings = Object.values(ratings).some(rating => rating > 0);

    if (hasAnyRatings) {
      const sorted = [...orderedTasks].sort((a, b) => {
        const ratingA = ratings[a] || 0;
        const ratingB = ratings[b] || 0;

        return ratingB - ratingA;
      });
      setOrderedTasks(sorted);
    }
  }, [ratings]);

  const handleRatingChange = (task: string, rating: number) => {
    setRatings(prev => ({ ...prev, [task]: rating }));
  };

  const handleNext = () => {
    const rankings: Record<string, number> = {};
    orderedTasks.forEach((task, index) => {
      rankings[task] = index + 1;
    });
    next({ rankings, ratings });
  };

  const handleQuestionClick = (task: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setPopupTask(task);
  };

  const closePopup = () => {
    setPopupTask(null);
  };

  const allTasksRated = tasks.every(task => ratings[task] > 0);

  return (
    <div className='min-h-screen w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]'>
      <div className='p-8 pt-16 max-w-4xl mx-auto flex flex-col gap-4 items-center'>
        <h2 className='text-4xl font-bold mb-6 text-center'>Rate the Games!</h2>
        <p className='mb-8 text-lg max-w-2xl'>
          We want to know how interested you would be in playing these games! Please rate each game from 1 (not interested) to 10 (very interested).
          The games will automatically order themselves based on your ratings. <br />
          If you want to read a game's description again, press the ? icon.
        </p>

        <div className='w-full max-w-2xl'>
          <div className='space-y-4'>
            <AnimatePresence>
              {orderedTasks.map((task, index) => (
                <motion.div
                  key={task}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  layoutId={task}
                  transition={{
                    layout: {
                      duration: 0.6,
                      ease: [0.4, 0, 0.2, 1],
                      type: "spring",
                      stiffness: 300,
                      damping: 30
                    },
                    opacity: { duration: 0.3 },
                    y: { duration: 0.3 },
                    scale: { duration: 0.2 }
                  }}
                  className='p-4 bg-white border-3 border-black rounded-lg shadow-[2px_2px_0px_rgba(0,0,0,1)] will-change-transform'
                  style={{
                    position: 'relative',
                    zIndex: ratings[task] ? 10 : 1
                  }}
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-4'>
                      <div className='w-8 h-8 rounded-full bg-yellow-300 border-2 border-black flex items-center justify-center font-bold text-lg'>
                        {index + 1}
                      </div>
                      <span className='font-semibold text-lg'>{taskNames[task]}</span>
                    </div>

                    <div className='flex items-center gap-2'>
                      <div className='flex gap-1'>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => handleRatingChange(task, rating)}
                            className={`w-8 h-8 rounded border-2 border-black font-bold text-sm transition-all duration-150 cursor-pointer ${
                              ratings[task] === rating
                                ? 'bg-blue-300 shadow-[2px_2px_0px_rgba(0,0,0,1)]'
                                : 'bg-white hover:bg-gray-100'
                            }`}
                          >
                            {rating}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={(e) => handleQuestionClick(task, e)}
                        className='w-6 h-6 rounded-full bg-white border-2 border-black flex items-center justify-center font-bold text-sm hover:bg-gray-400 cursor-help ml-2'
                        title={`Learn more about: ${task}`}
                      >
                        ?
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <button
          onClick={handleNext}
          disabled={!allTasksRated}
          className={`mt-8 px-8 py-3 border-2 border-black font-bold text-lg rounded-xl transition-all duration-150 ${
            allTasksRated
              ? 'cursor-pointer bg-white shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none text-black'
              : 'bg-white opacity-50 disabled:opacity-50 cursor-pointer select-none text-black'
          }`}
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
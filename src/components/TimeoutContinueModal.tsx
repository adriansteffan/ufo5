import { motion, AnimatePresence } from 'motion/react';

interface TimeoutContinueModalProps {
  isOpen: boolean;
  onContinue: () => void;
  onEnd: () => void;
}

export const TimeoutContinueModal = ({ isOpen, onContinue, onEnd }: TimeoutContinueModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className='bg-white border-4 border-black rounded-lg shadow-[5px_5px_0px_rgba(0,0,0,1)] p-6 max-w-md mx-4'
          >
            <h3 className='text-2xl font-bold text-center mb-4'>Time&apos;s up!</h3>
            <p className='text-center mb-6'>
              Would you like to continue the game to finish your last move?
            </p>
            <div className='flex gap-4'>
              <button
                onClick={onEnd}
                className='flex-1 cursor-pointer bg-white px-4 py-3 border-2 border-black font-bold text-black rounded-lg shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all duration-150'
              >
                End
              </button>
              <button
                onClick={onContinue}
                className='flex-1 cursor-pointer bg-white px-4 py-3 border-2 border-black font-bold text-black rounded-lg shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all duration-150'
              >
                Continue
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

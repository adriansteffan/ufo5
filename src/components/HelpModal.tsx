import { motion, AnimatePresence } from 'motion/react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const HelpModal = ({ isOpen, onClose, title = 'How to Play', children }: HelpModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50'
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className='bg-white border-4 border-black rounded-lg shadow-[5px_5px_0px_rgba(0,0,0,1)] p-6 max-w-md mx-4'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-xl font-bold'>{title}</h3>
              <button
                onClick={onClose}
                className='w-8 h-8 rounded-full bg-red-300 border-2 border-black flex items-center justify-center font-bold text-lg hover:bg-red-400 select-none cursor-pointer'
                style={{ lineHeight: '1', paddingBottom: '2px' }}
              >
                ×
              </button>
            </div>
            <div className='mb-4'>
              {children}
            </div>
            <button
              onClick={onClose}
              className='w-full cursor-pointer bg-white px-4 py-2 border-2 border-black font-bold text-black rounded-lg shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all duration-150 mt-6'
            >
              Got it!
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
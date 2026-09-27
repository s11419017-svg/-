import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RehearsalPhoto } from '../../types';

interface RehearsalModalProps {
  photo: RehearsalPhoto | null;
  onClose: () => void;
}

export const RehearsalModal: React.FC<RehearsalModalProps> = ({ photo, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (photo) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [photo, onClose]);

  return createPortal(
    <AnimatePresence>
      {photo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="rehearsal-modal-title"
            initial={{ scale: 0.92, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative max-w-4xl w-full bg-[#1a1a1c] border border-stone-800 rounded-sm overflow-hidden shadow-2xl my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-[#1a1a1c]/80 text-stone-300 hover:text-white border border-stone-800 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400"
              aria-label="關閉排練照片視窗 (Esc)"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col lg:flex-row">
              <div className="lg:w-2/3 bg-stone-950 flex items-center justify-center p-2">
                <img
                  src={photo.image}
                  alt={`排練紀錄照片：${photo.title} (${photo.date})`}
                  referrerPolicy="no-referrer"
                  className="max-h-[70vh] w-auto object-contain"
                />
              </div>

              <div className="lg:w-1/3 p-6 sm:p-8 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-stone-800 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-sans text-[#8c2d2d] uppercase tracking-widest">
                    <Camera className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Rehearsal Archive</span>
                  </div>

                  <h3 id="rehearsal-modal-title" className="font-serif-tc text-2xl font-bold text-[#f5f5f4]">
                    {photo.title}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-stone-400 font-sans border-b border-stone-800 pb-3">
                    <Calendar className="w-3.5 h-3.5 text-stone-500" />
                    <span>{photo.date}</span>
                    <span>•</span>
                    <span className="uppercase text-[10px] bg-stone-800 px-2 py-0.5 rounded text-stone-300">
                      {photo.category}
                    </span>
                  </div>

                  <p className="text-sm text-stone-300 font-sans leading-relaxed">
                    {photo.caption}
                  </p>
                </div>

                <div className="pt-4 border-t border-stone-800 text-stone-500 text-[10px] font-sans">
                  慈濟大學實驗高級中學 115 級高三英文公演備忘錄
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};


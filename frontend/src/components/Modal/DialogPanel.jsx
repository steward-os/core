import { useRef, useState } from "react";
import { Dialog, DialogTitle, DialogPanel as HeadlessDialogPanel } from "@headlessui/react";
import { XMarkIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon } from "@heroicons/react/24/outline";

const CLOSE_THRESHOLD = 120;

const DialogPanel = ({ open, title, onClose, children, fullscreenOnMobile = false, fullscreen = false, noScroll = false, forceLight = false }) => {
  const [dragY, setDragY] = useState(0);
  const [maximized, setMaximized] = useState(false);
  const startY = useRef(null);
  const dragging = useRef(false);

  const handleTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
    dragging.current = true;
  };

  const handleTouchMove = (e) => {
    if (!dragging.current) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) setDragY(delta);
  };

  const handleTouchEnd = () => {
    if (dragY >= CLOSE_THRESHOLD) {
      onClose();
    }
    setDragY(0);
    dragging.current = false;
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50" transition>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm sm:transition-none transition duration-300 ease-out data-[closed]:opacity-0" aria-hidden="true" />
      <div className={`fixed inset-0 flex ${fullscreen || maximized ? 'items-stretch sm:pt-12' : fullscreenOnMobile ? 'sm:items-center sm:justify-center sm:p-4' : 'items-end sm:items-center sm:justify-center sm:p-4'}`}>
        <HeadlessDialogPanel
          transition
          style={{ transform: dragY > 0 ? `translateY(${dragY}px)` : undefined }}
          className={`w-full bg-white ${forceLight ? '' : 'dark:bg-gray-900'} shadow-2xl overflow-hidden flex flex-col sm:transition-none transition duration-300 ease-out data-[closed]:translate-y-full sm:data-[closed]:translate-y-0 sm:data-[closed]:opacity-100 sm:data-[closed]:scale-100 ${fullscreen || maximized
              ? 'h-full'
              : fullscreenOnMobile
              ? 'h-full sm:h-auto sm:rounded-xl sm:max-w-4xl sm:max-h-[85vh]'
              : 'rounded-t-2xl sm:rounded-xl sm:max-w-4xl max-h-[90vh] sm:max-h-[85vh]'
            }`}
        >
          {!fullscreenOnMobile && (
            <div
              className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0 cursor-grab active:cursor-grabbing"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className={`w-10 h-1 ${forceLight ? 'bg-gray-300' : 'bg-gray-300 dark:bg-gray-600'} rounded-full`} />
            </div>
          )}
          <div className={`flex items-center justify-between p-4 sm:p-6 border-b ${forceLight ? 'border-gray-200 bg-white' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'} flex-shrink-0`}>
            <DialogTitle className={`text-lg font-semibold ${forceLight ? 'text-gray-900' : 'text-gray-900 dark:text-gray-100'}`}>{title}</DialogTitle>
            <div className="flex items-center gap-1">
              {!fullscreen && (
                <button onClick={() => setMaximized(m => !m)} className={`hidden sm:block p-1 rounded-md text-gray-400 ${forceLight ? 'hover:text-gray-600' : 'hover:text-gray-600 dark:hover:text-gray-300'}`}>
                  {maximized ? <ArrowsPointingInIcon className="h-5 w-5" /> : <ArrowsPointingOutIcon className="h-5 w-5" />}
                </button>
              )}
              <button onClick={onClose} className={`p-1 rounded-md text-gray-400 ${forceLight ? 'hover:text-gray-600' : 'hover:text-gray-600 dark:hover:text-gray-300'}`}>
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className={`p-4 sm:p-6 flex-1 flex flex-col ${noScroll ? 'overflow-hidden' : 'overflow-y-auto'}`}>{children}</div>
        </HeadlessDialogPanel>
      </div>
    </Dialog>
  );
};

export default DialogPanel;

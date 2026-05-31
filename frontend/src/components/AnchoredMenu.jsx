import { Dialog, DialogPanel } from "@headlessui/react";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { useRef, useState } from "react";

const AnchoredMenu = ({ children, className = "" }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const triggerRef = useRef(null);

  const close = () => setOpen(false);

  const handleOpen = (e) => {
    e.stopPropagation();
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    setOpen(true);
  };

  return (
    <>
      <button
        ref={triggerRef}
        onClick={handleOpen}
        className={`p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors ${className}`}
        aria-label="Acties"
      >
        <EllipsisVerticalIcon className="w-5 h-5" />
      </button>

      <Dialog open={open} onClose={close} className="relative z-50">
        <div className="fixed inset-0 bg-black/40 dark:bg-black/70" aria-hidden="true" onClick={close} />
        <div className="fixed w-64" style={{ top: pos.top, right: pos.right }}>
          <DialogPanel className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/15 rounded-xl p-3 shadow-2xl dark:shadow-black/60">
            <div className="flex flex-col gap-1">
              {typeof children === "function" ? children({ close }) : children}
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
};

export default AnchoredMenu;

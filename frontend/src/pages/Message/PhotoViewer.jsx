import { Dialog, DialogPanel } from "@headlessui/react";
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";

const SWIPE_DISTANCE = 50;

/**
 * The photos full screen on black, like the Android app: swipe, arrow buttons or arrow keys go through
 * them, and a tap or click zooms in (scroll or drag to look around) and out again.
 */
const PhotoViewer = ({ photos, start, onClose }) => {
  const [index, setIndex] = useState(start);
  const [zoomed, setZoomed] = useState(false);
  const touchStart = useRef(null);
  const count = photos.length;

  const go = (step) => {
    setZoomed(false);
    setIndex((current) => (current + step + count) % count);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  const onTouchStart = (e) => {
    touchStart.current = zoomed ? null : e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (touchStart.current === null || count < 2) return;
    const distance = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(distance) > SWIPE_DISTANCE) go(distance < 0 ? 1 : -1);
  };

  const navButton = "absolute top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 hidden sm:block";

  return (
    <Dialog open onClose={onClose} className="relative z-[60]">
      <DialogPanel className="fixed inset-0 bg-black flex flex-col">
        <div className="flex items-center gap-3 p-3 text-white">
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10" aria-label="Sluiten">
            <XMarkIcon className="w-6 h-6" />
          </button>
          {count > 1 && <span className="text-sm">{index + 1} / {count}</span>}
        </div>
        <div
          className={`relative flex-1 ${zoomed ? "overflow-auto" : "overflow-hidden flex items-center justify-center"}`}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <img
            src={photos[index].url}
            alt={`Foto ${index + 1}`}
            onClick={() => setZoomed((z) => !z)}
            className={zoomed ? "max-w-none w-[250%] cursor-zoom-out" : "max-w-full max-h-full object-contain cursor-zoom-in"}
          />
          {count > 1 && !zoomed && (
            <>
              <button type="button" onClick={() => go(-1)} className={`${navButton} left-4`} aria-label="Vorige foto">
                <ChevronLeftIcon className="w-6 h-6" />
              </button>
              <button type="button" onClick={() => go(1)} className={`${navButton} right-4`} aria-label="Volgende foto">
                <ChevronRightIcon className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      </DialogPanel>
    </Dialog>
  );
};

export default PhotoViewer;

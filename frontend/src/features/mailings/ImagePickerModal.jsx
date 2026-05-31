import { useEffect, useState } from "react";
import DialogPanel from "../../components/Modal/DialogPanel";
import CenteredSpinner from "../../components/CenteredSpinner";
import pb from "../../pb";

const ImagePickerModal = ({ open, onClose, onSelect }) => {
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setIsLoading(true);
    pb.collection("bs_mailing_images")
      .getFullList({ sort: "-created" })
      .then(setImages)
      .finally(() => setIsLoading(false));
  }, [open]);

  return (
    <DialogPanel open={open} title="Kies een afbeelding" onClose={onClose}>
      {isLoading ? (
        <CenteredSpinner />
      ) : images.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">Geen afbeeldingen gevonden.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((record) => {
            const url = pb.files.getURL(record, record.file);
            return (
              <button
                key={record.id}
                type="button"
                onClick={() => { onSelect(url); onClose(); }}
                className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <img
                  src={url}
                  alt=""
                  className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                />
              </button>
            );
          })}
        </div>
      )}
    </DialogPanel>
  );
};

export default ImagePickerModal;

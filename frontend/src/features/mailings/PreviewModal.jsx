import { useEffect, useState } from "react";
import { ComputerDesktopIcon, DevicePhoneMobileIcon } from "@heroicons/react/24/outline";
import DialogPanel from "../../components/Modal/DialogPanel";

const DEVICES = [
  { key: "desktop", label: "Desktop", icon: ComputerDesktopIcon },
  { key: "phone", label: "Mobiel", icon: DevicePhoneMobileIcon },
];

const PreviewModal = ({ open, html, onClose }) => {
  const [device, setDevice] = useState("desktop");
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => { setIframeKey((k) => k + 1); }, [html]);

  const handleIframeLoad = (e) => {
    const iframe = e.target;
    const height = iframe.contentDocument?.documentElement?.scrollHeight;
    if (height) iframe.style.height = `${height}px`;
  };

  return (
    <DialogPanel open={open} title="Voorbeeld" onClose={onClose} fullscreenOnMobile forceLight>
      {html ? (
        <div className="flex flex-col gap-3">
          <div className="flex justify-center gap-1 sticky top-0 bg-white py-1 z-10">
            {DEVICES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setDevice(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-colors ${
                  device === key
                    ? "bg-gray-900 text-white border-gray-900"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
          <div className="flex justify-center">
            <iframe
              key={iframeKey}
              srcDoc={html}
              className="border-0"
              style={{ width: device === "phone" ? "375px" : "100%" }}
              title="Mailing voorbeeld"
              onLoad={handleIframeLoad}
            />
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic text-center py-8">
          Selecteer een template en voeg blokken toe om een voorbeeld te genereren.
        </p>
      )}
    </DialogPanel>
  );
};

export default PreviewModal;

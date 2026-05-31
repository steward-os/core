import { ClipboardIcon, EnvelopeIcon, ShareIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";

const ShareMenu = ({
  url,
  title,
  showText,
  description,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const buttonClasses = showText
    ? `flex items-center w-full px-3 py-2 border border-[var(--glass-border)] shadow-sm text-sm font-medium rounded-md text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${className}`
    : `p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors ${className}`;




  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const shareText = `${title}${description ? ` - ${description}` : ""}`;

  const handleWhatsApp = () => {
    const introText = "Beste leden:\n\n We zoeken nog vrijwilligers voor de volgende activiteit:";
    const whatsappText = encodeURIComponent(`${shareText}\n\n${url}`);
    window.open(`https://wa.me/?text=${introText} ${whatsappText}`, "_blank");
    setIsOpen(false);
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(`${shareText}\n\n${url}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
    setIsOpen(false);
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      alert("Link gekopieerd naar clipboard!");
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
    setIsOpen(false);
  };

  return (
    <div className={`relative ${showText ? "w-full" : ""} ${className}`} ref={menuRef}>
      {/* Share Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={buttonClasses}
        aria-label="Delen"
      >
        <ShareIcon className="w-5 h-5 mr-3" />
        {showText && <span>Delen</span>}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border border-[var(--glass-border)] rounded-xl shadow-xl z-[60] overflow-hidden">
          <div className="py-1 flex flex-col gap-1">
            {/* WhatsApp */}
            <button
              onClick={handleWhatsApp}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-green-50/50 dark:hover:bg-green-900/50 hover:text-green-600 dark:hover:text-green-400 transition-colors"
            >
              <svg className="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
              </svg>
              WhatsApp
            </button>

            {/* Email */}
            <button
              onClick={handleEmail}
              className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <EnvelopeIcon className="w-4 h-4 mr-3" />
              E-mail
            </button>

            {/* Copy Link */}
            <button
              onClick={handleCopyToClipboard}
              className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <ClipboardIcon className="w-4 h-4 mr-3" />
              Kopieer link
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareMenu;

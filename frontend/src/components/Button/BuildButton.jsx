import { BookOpenIcon } from "@heroicons/react/24/outline";
import { neutralIconButtonClasses } from "./iconButtonClasses";

/**
 * BuildButton component for opening the website builder and clearing caches
 * @param {Object} props - Component props
 * @param {Function} [props.onClick] - Optional click handler (overrides default build logic)
 * @param {boolean} [props.showText=false] - Whether to show text alongside the icon
 * @param {string} [props.className] - Additional classes to apply
 * @param {string} [props.size="normal"] - Size of the icon ("small" or "normal")
 * @returns {JSX.Element} Build button component
 */
export const BuildButton = ({ onClick, showText = false, className = "", size = "normal" }) => {
  const iconSize = size === "small" ? "w-4 h-4" : "w-5 h-5";

  const defaultOnClick = async () => {
    // Clear any cached responses for this URL
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        await cache.delete("/build-website-fanfare");
        await cache.delete("https://leden.fanfaresintservatius.nl/build-website-fanfare");
      }
    }
    window.open(
      `https://leden.fanfaresintservatius.nl/build-website-fanfare?t=${Date.now()}`,
      "_blank",
      "width=800,height=600,scrollbars=yes,resizable=yes",
    );
  };

  const buttonClasses = neutralIconButtonClasses(showText, className);

  return (
    <button
      onClick={onClick || defaultOnClick}
      className={buttonClasses}
      aria-label="Build site"
      title={!showText ? "Build site" : undefined}
    >
      <BookOpenIcon className={showText ? `${iconSize} mr-1` : iconSize} />
      {showText && "Build site"}
    </button>
  );
};

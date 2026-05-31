import React from "react";
import { Link } from "react-router-dom";

/**
 * Component to display banner messages
 * @param {Object[]} messages - Array of banner message objects
 * @param {string} messages[].id - Unique ID of the banner message
 * @param {string} messages[].message - HTML content of the banner message
 * @param {string} [messages[].link] - Optional link for the banner message
 * @returns {JSX.Element|null} - Banner messages component or null if no messages
 */
const BannerMessages = ({ messages }) => {
  if (!messages || messages.length === 0) {
    return null;
  }

  return (
    <div className="-mt-2 -mx-2 mb-6">
      <div className="p-3 pt-2 bg-amber-50 border border-amber-200 text-center text-amber-800">
        <div className="space-y-3">
          {messages.map((banner, index) => (
            <div key={banner.id} className={index === 0 ? "mt-0" : "mt-3"}>
              <div dangerouslySetInnerHTML={{ __html: banner.message }} />

              {banner.link && (
                <Link
                  to={banner.link}
                  className="inline-block mt-1 font-medium text-amber-700 hover:text-amber-900 underline"
                >
                  Meer informatie →
                </Link>
              )}

              {/* Add a divider between messages, but not after the last one */}
              {index < messages.length - 1 && <div className="border-t border-amber-200 mt-3"></div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BannerMessages;
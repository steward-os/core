import React from "react";
import { PlusIcon } from "@heroicons/react/24/outline";

export const Button = ({ text, children, onClick, disabled, ariaLabel, type = "button", className = "", color='blue' }) => {
    const colorTable = {
        blue: 'bg-blue-600 hover:bg-blue-700 text-white',
        red: 'bg-red-600 hover:bg-red-700 text-white',
        green: 'bg-green-600 hover:bg-green-700 text-white',
        yellow: 'bg-yellow-600 hover:bg-yellow-700 text-black',
        gray: 'bg-gray-200 hover:bg-gray-300 text-black',
    };
   return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`p-2 ${colorTable[color]} px-3 py-2 text-sm font-medium rounded-lg disabled:opacity-50 transition-colors whitespace-nowrap ${className}`}
      aria-label={ariaLabel}
    >
      {children ?? text}
    </button>
  );
};
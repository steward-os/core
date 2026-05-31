import React from "react";
import { Link } from "react-router-dom";
import { MusicalNoteIcon, PlayIcon, BellIcon } from "@heroicons/react/24/outline";
import PageContent from "../components/Page/PageContent";
import PageHeader from "../components/Page/PageHeader";

const toolsData = [
  {
    id: "tuner",
    name: "Stemapparaat",
    description: "Stem je instrument met onze ingebouwde tuner",
    icon: MusicalNoteIcon,
    path: "/tuner",
    color: "bg-blue-500 hover:bg-blue-600",
  },
  {
    id: "music-recordings",
    name: "Opnames muziekstukken",
    description: "Luister naar opnames van muziekstukken",
    icon: PlayIcon,
    path: "/music-recordings",
    color: "bg-purple-500 hover:bg-purple-600",
  },
  {
    id: "notifications",
    name: "Meldingen",
    description: "Test en configureer push notificaties",
    icon: BellIcon,
    path: "/notification-settings",
    color: "bg-green-500 hover:bg-green-600",
  },
  {
    id: "sponsorkliks",
    name: "Sponsorkliks",
    description: "Shop online en steun de fanfare",
    logoUrl: "https://www.sponsorkliks.com/img/sklogo-matte.png",
    href: "https://www.sponsorkliks.com/products/shops.php?club=7914&cn=nl&ln=nl",
    color: "bg-[#2F4050] hover:bg-[#5a5db3]",
    external: true,
  },
];

const Tools = () => {
  return (
    <PageContent>
      <PageHeader title="Tools" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {toolsData.map((tool) => {
          const Icon = tool.icon;
          const content = (
            <div
              className={`${tool.color} text-white rounded-lg p-6 h-full flex flex-col items-center text-center transition-colors duration-200`}
            >
              {tool.logoUrl ? (
                <img src={tool.logoUrl} alt={`${tool.name} logo`} className="w-16 h-16 mb-4 object-contain" />
              ) : (
                <Icon className="w-16 h-16 mb-4" />
              )}
              <h3 className="text-lg font-semibold mb-2">{tool.name}</h3>
              <p className="text-sm opacity-90">{tool.description}</p>
            </div>
          );

          if (tool.external) {
            return (
              <a key={tool.id} href={tool.href} target="_blank" rel="noopener noreferrer" className="block h-40">
                {content}
              </a>
            );
          }

          return (
            <Link key={tool.id} to={tool.path} className="block h-40">
              {content}
            </Link>
          );
        })}
      </div>
      <p className="mt-8 text-center text-xs text-gray-400">Build: {__COMMIT_HASH__}</p>
    </PageContent>
  );
};

export default Tools;

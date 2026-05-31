export const menuItems = [
  { key: "home", label: "Agenda", path: "/" },
  { key: "volunteering", label: "Vrijwilligers", path: "/volunteering" },
  { key: "messages", label: "Berichten", path: "/messages" },
  { key: "tools", label: "Tools", path: "/tools" },
];

export const adminMenuItems = [
  { key: "users", label: "Gebruikers", path: "/users", adminPage: true },
  { key: "groups", label: "Groepen", path: "/groups", adminPage: true },
  { key: "banners", label: "Banners", path: "/banners", adminPage: true },
  { key: "meeting-templates", label: "Meeting templates", path: "/meeting-templates", adminPage: true },
  { key: "tags", label: "Tags", path: "/tags", adminPage: true },
  { key: "music-recordings-admin", label: "Muziek opnames", path: "/music-recordings-admin", adminPage: true },
  { key: "standard-reactions", label: "Standaard reacties", path: "/standard-reactions", adminPage: true },
  { key: "parameters", label: "Parameters", path: "/parameters", adminPage: true },
  { key: "media-files", label: "Bestanden", path: "/media-files", adminPage: true },
  { key: "encryptie", label: "Encryptie", path: "/encryptie", adminPage: true },
  { key: "settings", label: "Settings", path: "/settings", adminPage: true },
];

export const sessionMenuItems = [
  { key: "sessions", label: "Agendabeheer", path: "/sessions", sessionAdminPage: true },
  { key: "attendance-matrix", label: "Overzicht aanwezigheid", path: "/attendance-matrix", sessionAdminPage: true },
];

export const boardMenuItems = [
  { key: "meetings", label: "Vergaderingen", path: "/meetings", boardMemberPage: true },
  { key: "bs-actions", label: "Acties", path: "/actions", boardMemberPage: true },
  { key: "projects", label: "Projecten", path: "/projects", boardMemberPage: true },
  { key: "relations", label: "Relatiebeheer", path: "/relations", boardMemberPage: true },
  { key: "correspondence", label: "Correspondentie", path: "/correspondence", boardMemberPage: true },
  {
    key: "email-templates",
    label: "E-mailtemplates",
    path: "/email-templates",
    boardMemberPage: true,
    group: "Mailings",
  },
  { key: "mailing-blocks", label: "Mailingblokken", path: "/mailing-blocks", boardMemberPage: true, group: "Mailings" },
  { key: "mailings", label: "Overzicht mailings", path: "/mailings", boardMemberPage: true, group: "Mailings" },
];

export const financeMenuItems = [
  { key: "overview", label: "Overzicht", path: "/finance/overview", financePage: true },
  { key: "trial-balance", label: "Proefbalans", path: "/finance/trial-balance", financePage: true },
  { key: "members", label: "Leden", path: "/finance/members", financePage: true },
  { key: "fiscal-years", label: "Boekjaren", path: "/finance/fiscal-years", financePage: true },
  { key: "ledger-accounts", label: "Grootboekrekeningen", path: "/finance/ledger-accounts", financePage: true },
  { key: "journal-transactions", label: "Dagboek", path: "/finance/journal-transactions", financePage: true },
  { key: "sales-invoices", label: "Verkoopfacturen", path: "/finance/sales-invoices", financePage: true },
  { key: "purchase-invoices", label: "Inkoopfacturen", path: "/finance/purchase-invoices", financePage: true },
  { key: "bank-statement-lines", label: "Bankafschriften", path: "/finance/bank-statement-lines", financePage: true },
  { key: "batch-runs", label: "Batchruns", path: "/finance/batch-runs", financePage: true },
];

export const getVisibleAdminMenuItems = (isAdmin, isVolunteerAdmin, isBannerAdmin) =>
  adminMenuItems.filter(
    (item) =>
      (item.adminPage && isAdmin) ||
      (item.volunteerAdminPage && isVolunteerAdmin) ||
      (item.bannerAdminPage && isBannerAdmin),
  );

export const getVisibleBoardMenuItems = (isAdmin, isBoardMember) =>
  boardMenuItems.filter((item) => (item.adminPage && isAdmin) || (item.boardMemberPage && isBoardMember));

export const getVisibleSessionMenuItems = (isAdmin, isSessionAdmin) =>
  sessionMenuItems.filter((item) => (item.sessionAdminPage && isAdmin) || (item.sessionAdminPage && isSessionAdmin));

export const getVisibleFinanceMenuItems = (isFinancialAdmin) => (isFinancialAdmin ? financeMenuItems : []);

export const getVisibleAccountMenuItems = (isBoardMember, isFinancialAdmin) => [
  ...(isBoardMember || isFinancialAdmin ? [{ key: "sleutels", label: "Sleutels", path: "/account/sleutels" }] : []),
  { key: "logout", label: "Uitloggen", path: "/account/logout" },
];

// Groups items by their `group` key. Returns a mixed array of plain items and
// group objects { type: 'group', name, items } in the order they first appear.
export function groupMenuItems(items) {
  const result = [];
  const groupMap = new Map();

  for (const item of items) {
    if (item.group) {
      if (!groupMap.has(item.group)) {
        const group = { type: "group", name: item.group, items: [] };
        groupMap.set(item.group, group);
        result.push(group);
      }
      groupMap.get(item.group).items.push(item);
    } else {
      result.push(item);
    }
  }

  return result;
}

export const allMenuItemPaths = [
  ...menuItems,
  ...adminMenuItems,
  ...sessionMenuItems,
  ...boardMenuItems,
  ...financeMenuItems,
  { path: "/account/sleutels" },
  { path: "/account/logout" },
].map((item) => item.path);

/**
 * GnuCash native XML (.gnucash) file generator
 * Generates a complete GnuCash book with accounts, opening balances, and transactions.
 */

function escapeXml(unsafe) {
  if (unsafe === null || unsafe === undefined) return "";
  return String(unsafe).replace(/[<>&"']/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "\"": return "&quot;";
      case "'": return "&apos;";
      default: return c;
    }
  });
}

function guid() {
  return "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx".replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  );
}

function gnuDate(dateStr) {
  const d = new Date(dateStr || new Date());
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day} 00:00:00 +0000`;
}

/** Converts a decimal amount to GnuCash fraction format (e.g. 12.34 → "1234/100") */
function fraction(amount) {
  return `${Math.round(Number(amount) * 100)}/100`;
}

// Maps our categories to GnuCash account types
const GNU_ACCOUNT_TYPE = {
  ASSETS: "ASSET",
  LIABILITIES: "LIABILITY",
  EQUITY: "EQUITY",
  REVENUE: "INCOME",
  EXPENSES: "EXPENSE",
};

/**
 * Returns the signed GnuCash split value for a journal entry.
 * GnuCash rule: all splits in a transaction must sum to zero.
 * Universal convention: debit → positive, credit → negative (all account types).
 * GnuCash applies its own sign flip when displaying credit-normal accounts
 * (equity, liability, income) in the account tree and reports.
 */
function splitValue(entry) {
  const debit = Number(entry.debit || 0);
  const credit = Number(entry.credit || 0);
  return debit > 0 ? debit : -credit;
}

function accountXml(id, name, type, parentGuid, description = "") {
  return `  <gnc:account version="2.0.0">
    <act:name>${escapeXml(name)}</act:name>
    <act:id type="guid">${id}</act:id>
    <act:type>${type}</act:type>
    <act:commodity>
      <cmdty:space>ISO4217</cmdty:space>
      <cmdty:id>EUR</cmdty:id>
    </act:commodity>
    <act:commodity-scu>100</act:commodity-scu>${description ? `\n    <act:description>${escapeXml(description)}</act:description>` : ""}
    <act:parent type="guid">${parentGuid}</act:parent>
  </gnc:account>`;
}

function transactionXml(txGuid, txDate, description, num, splits) {
  const date = gnuDate(txDate);
  const splitsXml = splits
    .map(
      ({ splitGuid, accGuid, amount, memo }) => `      <trn:split>
        <split:id type="guid">${splitGuid}</split:id>
        <split:memo>${escapeXml(memo || "")}</split:memo>
        <split:reconciled-state>n</split:reconciled-state>
        <split:value>${fraction(amount)}</split:value>
        <split:quantity>${fraction(amount)}</split:quantity>
        <split:account type="guid">${accGuid}</split:account>
      </trn:split>`
    )
    .join("\n");

  return `  <gnc:transaction version="2.0.0">
    <trn:id type="guid">${txGuid}</trn:id>
    <trn:currency>
      <cmdty:space>ISO4217</cmdty:space>
      <cmdty:id>EUR</cmdty:id>
    </trn:currency>
    <trn:date-posted>
      <ts:date>${date}</ts:date>
    </trn:date-posted>
    <trn:date-entered>
      <ts:date>${date}</ts:date>
    </trn:date-entered>
    <trn:description>${escapeXml(description)}</trn:description>
    <trn:num>${escapeXml(num || "")}</trn:num>
    <trn:splits>
${splitsXml}
    </trn:splits>
  </gnc:transaction>`;
}

/**
 * Generates a GnuCash native XML string for a fiscal year.
 *
 * @param {Object} fiscalYear    - { year_name, start_date, end_date }
 * @param {Array}  ledgerAccounts - [{ id, account_number, name, category, is_bank_account }]
 * @param {Array}  transactions   - [{ entry_number, transaction_date, description, entries: [...] }]
 * @param {Array}  openingBalances - [{ account_number, amount, side }]
 * @returns {string} GnuCash XML string
 */
export function generateGnuCash({ fiscalYear, ledgerAccounts, transactions, openingBalances }) {
  const bookGuid = guid();
  const rootGuid = guid();
  const openingBalancesAccountGuid = guid();

  // Assign a stable GUID per ledger account (keyed by PocketBase id)
  const accGuidById = {};
  const accById = {};
  const accByNumber = {};
  for (const acc of ledgerAccounts) {
    accGuidById[acc.id] = guid();
    accById[acc.id] = acc;
    accByNumber[acc.account_number] = acc;
  }

  // --- Accounts ---
  const rootAccountXml = `  <gnc:account version="2.0.0">
    <act:name>Root Account</act:name>
    <act:id type="guid">${rootGuid}</act:id>
    <act:type>ROOT</act:type>
  </gnc:account>`;

  const openingBalancesAccountXml = accountXml(
    openingBalancesAccountGuid,
    "Opening Balances",
    "EQUITY",
    rootGuid,
    "Beginsaldi"
  );

  const ledgerAccountsXml = ledgerAccounts.map((acc) => {
    const type = acc.is_bank_account ? "BANK" : (GNU_ACCOUNT_TYPE[acc.category] || "ASSET");
    return accountXml(
      accGuidById[acc.id],
      `${acc.account_number} - ${acc.name}`,
      type,
      rootGuid,
      acc.name
    );
  }).join("\n");

  // --- Opening balance transactions (one per account with a non-zero balance) ---
  const openingTxXmls = openingBalances
    .map((ob) => {
      const acc = accByNumber[ob.account_number];
      if (!acc) return null;

      const accGuid = accGuidById[acc.id];
      // Debit balance → positive split, credit balance → negative split (universal GnuCash rule)
      const accAmount = ob.side === "D" ? ob.amount : -ob.amount;
      const offsetAmount = -accAmount;

      return transactionXml(guid(), fiscalYear.start_date, "Beginsaldo", "", [
        { splitGuid: guid(), accGuid, amount: accAmount, memo: `Beginsaldo ${acc.account_number}` },
        { splitGuid: guid(), accGuid: openingBalancesAccountGuid, amount: offsetAmount, memo: `Beginsaldo ${acc.account_number}` },
      ]);
    })
    .filter(Boolean);

  // --- Journal transactions ---
  const journalTxXmls = transactions.map((tx) => {
    const splits = tx.entries
      .map((entry) => {
        const acc = entry.expand?.ledger_account;
        if (!acc) return null;
        const accGuid = accGuidById[acc.id];
        if (!accGuid) return null;
        const amount = splitValue(entry);
        return { splitGuid: guid(), accGuid, amount, memo: tx.description };
      })
      .filter(Boolean);

    if (splits.length === 0) return null;
    return transactionXml(guid(), tx.transaction_date, tx.description, tx.entry_number, splits);
  }).filter(Boolean);

  const allTransactions = [...openingTxXmls, ...journalTxXmls];
  // +2 for root account + opening balances account
  const totalAccounts = ledgerAccounts.length + 2;
  const totalTransactions = allTransactions.length;

  return `<?xml version="1.0" encoding="utf-8" ?>
<gnc-v2 xmlns:gnc="http://www.gnucash.org/XML/gnc"
         xmlns:book="http://www.gnucash.org/XML/book"
         xmlns:cd="http://www.gnucash.org/XML/cd"
         xmlns:ts="http://www.gnucash.org/XML/ts"
         xmlns:slot="http://www.gnucash.org/XML/slot"
         xmlns:cmdty="http://www.gnucash.org/XML/cmdty"
         xmlns:price="http://www.gnucash.org/XML/price"
         xmlns:trn="http://www.gnucash.org/XML/trn"
         xmlns:split="http://www.gnucash.org/XML/split"
         xmlns:act="http://www.gnucash.org/XML/act"
         xmlns:recurrence="http://www.gnucash.org/XML/recurrence">
  <gnc:count-data cd:type="book">1</gnc:count-data>
  <gnc:book version="2.0.0">
    <book:id type="guid">${bookGuid}</book:id>
    <book:slots>
      <slot>
        <slot:key>default-currency</slot:key>
        <slot:value type="string">EUR</slot:value>
      </slot>
    </book:slots>
    <gnc:count-data cd:type="commodity">1</gnc:count-data>
    <gnc:count-data cd:type="account">${totalAccounts}</gnc:count-data>
    <gnc:count-data cd:type="transaction">${totalTransactions}</gnc:count-data>
    <gnc:commodity version="2.0.0">
      <cmdty:space>ISO4217</cmdty:space>
      <cmdty:id>EUR</cmdty:id>
      <cmdty:name>Euro</cmdty:name>
      <cmdty:xcode>978</cmdty:xcode>
      <cmdty:fraction>100</cmdty:fraction>
      <cmdty:get_quotes/>
      <cmdty:quote_source>currency</cmdty:quote_source>
      <cmdty:quote_tz/>
    </gnc:commodity>
${rootAccountXml}
${openingBalancesAccountXml}
${ledgerAccountsXml}
${allTransactions.join("\n")}
  </gnc:book>
</gnc-v2>`;
}

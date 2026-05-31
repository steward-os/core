/**
 * MT940 Bank Statement Parser
 * Supports ING, Rabobank, ABN AMRO and generic MT940 format
 */

/**
 * Parse a YYMMDD date string to ISO date format (YYYY-MM-DD)
 */
function parseDate(yymmdd) {
  const year = "20" + yymmdd.slice(0, 2);
  const month = yymmdd.slice(2, 4);
  const day = yymmdd.slice(4, 6);
  return `${year}-${month}-${day}`;
}

/**
 * Parse MT940 amount string (comma as decimal separator) to float
 * C = credit (positive), D = debit (negative)
 */
function parseAmount(sign, amountStr) {
  const value = parseFloat(amountStr.replace(",", "."));
  return sign === "D" ? -value : value;
}

/**
 * Clean up description for ING bank
 * ING uses sub-fields like /TRCD/, /REMI/, /NAME/, /IBAN/, etc.
 */
function cleanIngDescription(raw) {
  // Remove known ING sub-field keys, keep the values
  return raw
    .replace(/\/[A-Z]{2,6}\//g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Clean up description for Rabobank
 * Rabobank uses SEPA sub-fields like /MARF/, /EREF/, /CSID/, /CNTP/, /REMI/, etc.
 */
function cleanRabobankDescription(raw) {
  return raw
    .replace(/\/[A-Z]{2,6}\//g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Format description based on bank format
 */
function formatDescription(raw, bankFormat) {
  const normalized = raw.replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
  switch (bankFormat) {
    case "ing":
      return cleanIngDescription(normalized);
    case "rabobank":
      return cleanRabobankDescription(normalized);
    case "abnamro":
    case "generic":
    default:
      return normalized;
  }
}

/**
 * Split MT940 content into tag blocks.
 * Each block starts with a tag like :20:, :61:, :86:, etc.
 * Continuation lines (without a tag) are appended to the current block.
 */
function splitIntoTagBlocks(content) {
  const lines = content.split(/\r?\n/);
  const blocks = [];
  let current = null;

  for (const line of lines) {
    // Tag line: starts with :XX: or :XXX:
    if (/^:[0-9A-Z]{2,3}[A-Z]?:/.test(line)) {
      if (current !== null) {
        blocks.push(current);
      }
      current = line;
    } else if (current !== null && line.trim() !== "" && !line.startsWith("-")) {
      // Continuation line (append to current block)
      current += "\n" + line;
    } else {
      // Message separator or empty line — push current and reset
      if (current !== null) {
        blocks.push(current);
        current = null;
      }
    }
  }
  if (current !== null) {
    blocks.push(current);
  }
  return blocks;
}

/**
 * Parse a single :61: statement line
 * Format: YYMMDD[MMDD]C/D[amount]N[type][//ref][\nname]
 */
function parseStatementLine(line61) {
  // Remove the :61: prefix
  const content = line61.replace(/^:61:/, "");

  // Date: first 6 chars = YYMMDD, optionally followed by 4 more for entry date MMDD
  const dateMatch = content.match(/^(\d{6})(\d{4})?([CD]R?)(\d+,\d{0,2})N/);
  if (!dateMatch) return null;

  const dateStr = dateMatch[1];
  const signRaw = dateMatch[3]; // C, D, CR, DR, etc.
  const sign = signRaw.startsWith("C") ? "C" : "D";
  const amountStr = dateMatch[4];

  return {
    date: parseDate(dateStr),
    amount: parseAmount(sign, amountStr),
  };
}

/**
 * Main MT940 parser
 * @param {string} content - Raw MT940 file content
 * @param {string} bankFormat - 'generic' | 'ing' | 'rabobank' | 'abnamro'
 * @returns {Array<{ date: string, amount: number, description: string }>}
 */
export function parseMT940(content, bankFormat = "generic") {
  const blocks = splitIntoTagBlocks(content);
  const transactions = [];

  let pendingTransaction = null;

  for (const block of blocks) {
    const tagMatch = block.match(/^:([0-9A-Z]{2,3}[A-Z]?):/);
    if (!tagMatch) continue;
    const tag = tagMatch[1];

    if (tag === "61") {
      // If there's a pending transaction without description, save it
      if (pendingTransaction) {
        transactions.push(pendingTransaction);
      }
      const parsed = parseStatementLine(block);
      if (parsed) {
        pendingTransaction = { ...parsed, description: "" };
      } else {
        pendingTransaction = null;
      }
    } else if (tag === "86") {
      // Description for the previous :61: transaction
      const rawDescription = block.replace(/^:86:/, "");
      if (pendingTransaction) {
        pendingTransaction.description = formatDescription(rawDescription, bankFormat);
        transactions.push(pendingTransaction);
        pendingTransaction = null;
      }
    } else {
      // Other tags: if there's a pending transaction, flush it
      if (pendingTransaction) {
        transactions.push(pendingTransaction);
        pendingTransaction = null;
      }
    }
  }

  // Flush any remaining pending transaction
  if (pendingTransaction) {
    transactions.push(pendingTransaction);
  }

  return transactions;
}

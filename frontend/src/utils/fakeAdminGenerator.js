import pb from "../pb";
import { getAllLedgerAccounts, createLedgerAccount, updateLedgerAccount } from "../services/ledgerAccountService";
import { createJournalTransaction, createJournalEntry } from "../services/journalTransactionService";
import { LEDGER_ACCOUNT_SEEDS } from "../seeds/ledgerAccounts";

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const fmtDate = (year, month, day) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const fmt = (amount) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(amount);

const MAANDEN = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];

const dateLabel = (dateStr) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return `${day} ${MAANDEN[month - 1]} ${year}`;
};

const DUTCH_FIRST_NAMES = [
  "Jan", "Pieter", "Henk", "Willem", "Klaas", "Roel", "Joost", "Bart", "Cees", "Dirk",
  "Thomas", "Mark", "Jeroen", "Stefan", "Erik", "Annelies", "Maria", "Sophie", "Laura",
  "Emma", "Marlies", "Ans", "Els", "Inge", "Noor", "Lotte", "Femke", "Claudia", "Hanne",
];
const DUTCH_LAST_NAMES = [
  "De Vries", "Jansen", "Van den Berg", "Bakker", "Visser", "Smit", "Meijer", "De Boer",
  "Peters", "Mulder", "Hendriks", "Dijkstra", "Bos", "Van Dijk", "Vermeer", "Van Dam",
  "Koster", "Kok", "Prins", "Laan", "Bosman", "Hoekstra", "Wolters", "Peeters", "Nieuwenhuis",
];
const VRIJWILLIGER_ACTIES = [
  "Bingo avond", "Rommelmarkt", "Loterij", "Collecte", "Fancy fair", "Sponsorloop", "Braderie",
];

async function clearFiscalYearData(fiscalYearId) {
  const [bankLines, transactions] = await Promise.all([
    pb.collection("fi_bank_statement_lines").getFullList({
      filter: `journal_transaction.fiscal_year = "${fiscalYearId}"`,
      fields: "id",
    }),
    pb.collection("fi_journal_transactions").getFullList({
      filter: `fiscal_year = "${fiscalYearId}"`,
      fields: "id",
    }),
  ]);
  for (const item of bankLines) await pb.collection("fi_bank_statement_lines").delete(item.id);
  for (const item of transactions) await pb.collection("fi_journal_transactions").delete(item.id);
}

async function ensureAccounts() {
  const existing = await getAllLedgerAccounts();
  const existingNumbers = new Set(existing.map((a) => a.account_number));
  for (const account of LEDGER_ACCOUNT_SEEDS) {
    if (!existingNumbers.has(account.account_number)) {
      await createLedgerAccount(account);
    }
  }
  const all = await getAllLedgerAccounts();
  const bankAccount = all.find((a) => a.account_number === "1000");
  if (bankAccount && !bankAccount.is_bank_account) {
    await updateLedgerAccount(bankAccount.id, { is_bank_account: true });
  }
  const refreshed = await getAllLedgerAccounts();
  const map = {};
  for (const a of refreshed) map[a.account_number] = a;
  return map;
}

// category: "income" | "expense" | "advance" | "recognition" | "neutral"
export async function generateFakeAdministratie(fiscalYear, onProgress = () => {}) {
  const year = parseInt(fiscalYear.start_date.slice(0, 4));
  let txCounter = 0;
  const nextEntry = () => `${year}-${String(++txCounter).padStart(3, "0")}`;
  const events = [];

  const today = new Date();
  const isCurrentYear = year === today.getFullYear();
  const todayStr = today.toISOString().slice(0, 10);
  const maxMonth = isCurrentYear ? today.getMonth() + 1 : 12;
  // Returns null if the month is out of range for this year, else a random month in [min, max]
  const randMonth = (min, max) => {
    const hi = isCurrentYear ? Math.min(max, maxMonth) : max;
    return hi < min ? null : rand(min, hi);
  };
  // Returns false if the date string is in the future (only relevant for current year)
  const dateOk = (dateStr) => !isCurrentYear || dateStr <= todayStr;

  const createTx = async (date, description, transaction_type, fyId, entries) => {
    const tx = await createJournalTransaction({
      entry_number: nextEntry(),
      transaction_date: date,
      description,
      transaction_type,
      fiscal_year: fyId,
    });
    for (const e of entries) {
      await createJournalEntry({
        journal_transaction: tx.id,
        ledger_account: e.accountId,
        debit: e.debit || 0,
        credit: e.credit || 0,
        memo: e.memo || "",
      });
    }
    if (transaction_type === "BANK_IMPORT") {
      const bankId = acc("1000");
      const bankEntry = entries.find((e) => e.accountId === bankId);
      const counterEntry = entries.find((e) => e.accountId !== bankId);
      if (bankEntry && counterEntry) {
        const amount = (bankEntry.debit || 0) - (bankEntry.credit || 0);
        await pb.collection("fi_bank_statement_lines").create({
          date,
          amount,
          description,
          status: "PROCESSED",
          journal_transaction: tx.id,
          counter_account: counterEntry.accountId,
        });
      }
    }
  };

  // Step 1: Clear data for this fiscal year only
  onProgress("Bestaande data verwijderen...");
  await clearFiscalYearData(fiscalYear.id);

  const fyId = fiscalYear.id;

  // Step 2: Accounts
  onProgress("Grootboekrekeningen controleren...");
  const accounts = await ensureAccounts();
  const acc = (num) => accounts[num]?.id;

  // Step 4: Monthly rent
  onProgress("Huurbetalingen aanmaken...");
  for (let month = 1; month <= maxMonth; month++) {
    const d = fmtDate(year, month, 1);
    if (!dateOk(d)) continue;
    await createTx(d, "Huur repetitieruimte", "BANK_IMPORT", fyId, [
      { accountId: acc("4800"), debit: 750 },
      { accountId: acc("1000"), credit: 750 },
    ]);
  }
  events.push({
    date: "2024-01-01",
    category: "expense",
    title: "Maandelijkse huur repetitieruimte (12×)",
    detail: `De fanfare huurt een vaste oefenruimte voor ${fmt(750)} per maand (totaal ${fmt(750 * 12)} per jaar). Dit zijn vaste lasten die elke eerste van de maand via de bank worden betaald.`,
    entry: "Debet 4800 Huisvesting / Zaalhuur — Credit 1000 Bank / Kas",
    type: "BANK_IMPORT",
  });

  // Step 5: Member contributions
  onProgress("Contributies aanmaken...");
  const numMembers = rand(28, 35);
  const memberNames = [];
  const usedNames = new Set();
  while (memberNames.length < numMembers) {
    const name = `${DUTCH_FIRST_NAMES[rand(0, DUTCH_FIRST_NAMES.length - 1)]} ${DUTCH_LAST_NAMES[rand(0, DUTCH_LAST_NAMES.length - 1)]}`;
    if (!usedNames.has(name)) {
      usedNames.add(name);
      memberNames.push({ name, amount: rand(125, 165) });
    }
  }

  const numLate = rand(3, 5);
  const numManual = rand(2, 4);
  const sepaMembers = memberNames.slice(0, numMembers - numLate - numManual);
  const lateMembers = memberNames.slice(sepaMembers.length, sepaMembers.length + numLate);
  const manualMembers = memberNames.slice(sepaMembers.length + numLate);

  // SEPA batch
  const sepaTotal = sepaMembers.reduce((sum, m) => sum + m.amount, 0);
  if (dateOk(fmtDate(year, 1, 15)))
  await createTx(fmtDate(year, 1, 15), `SEPA Incasso Contributie ${year}`, "BANK_IMPORT", fyId, [
    { accountId: acc("1000"), debit: sepaTotal },
    { accountId: acc("8000"), credit: sepaTotal },
  ]);
  events.push({
    date: "2024-01-15",
    category: "income",
    title: `SEPA-incasso contributie — ${sepaMembers.length} leden (${fmt(sepaTotal)})`,
    detail: `De meeste leden (${sepaMembers.length} van de ${numMembers}) betalen hun jaarlijkse contributie via automatische incasso (SEPA). Op 15 januari wordt het totaalbedrag van ${fmt(sepaTotal)} in één batch geïncasseerd van de bankrekeningen van de leden. Dit is efficiënter dan individuele overschrijvingen.`,
    entry: "Debet 1000 Bank / Kas — Credit 8000 Contributies",
    type: "BANK_IMPORT",
  });

  // Late payers
  for (const member of lateMembers) {
    const m = randMonth(2, 4); if (!m) continue;
    const d = fmtDate(year, m, rand(1, 28)); if (!dateOk(d)) continue;
    await createTx(d, `Contributie ${member.name}`, "BANK_IMPORT", fyId, [
      { accountId: acc("1000"), debit: member.amount },
      { accountId: acc("8000"), credit: member.amount },
    ]);
    events.push({
      date: d,
      category: "income",
      title: `Te laat betaalde contributie — ${member.name} (${fmt(member.amount)})`,
      detail: `${member.name} heeft de contributie niet op tijd via SEPA betaald en doet een aparte overboeking. Dit resulteert in een individuele banktransactie in plaats van de batchincasso van januari.`,
      entry: "Debet 1000 Bank / Kas — Credit 8000 Contributies",
      type: "BANK_IMPORT",
    });
  }

  // Manual payers
  for (const member of manualMembers) {
    const m = randMonth(3, 4); if (!m) continue;
    const d = fmtDate(year, m, rand(1, 28)); if (!dateOk(d)) continue;
    await createTx(d, `Contributie contant ${member.name}`, "CASH_MUTATION", fyId, [
      { accountId: acc("1000"), debit: member.amount },
      { accountId: acc("8000"), credit: member.amount },
    ]);
    events.push({
      date: d,
      category: "income",
      title: `Contributie contant betaald — ${member.name} (${fmt(member.amount)})`,
      detail: `${member.name} betaalt de contributie contant aan de penningmeester. Omdat dit géén banktransactie is, wordt het als kasboeking (CASH_MUTATION) geregistreerd. Het geld gaat vervolgens naar de kas of wordt gestort op de bankrekening.`,
      entry: "Debet 1000 Bank / Kas — Credit 8000 Contributies",
      type: "CASH_MUTATION",
    });
  }

  // Step 6: Municipal subsidy (1–2×)
  onProgress("Subsidies aanmaken...");
  const subsidyMonths = rand(1, 2) === 2 ? [4, 9] : [4];
  for (const month of subsidyMonths) {
    if (isCurrentYear && month > maxMonth) continue;
    const amount = rand(2000, 4000);
    const d = fmtDate(year, month, rand(5, 20)); if (!dateOk(d)) continue;
    await createTx(d, "Subsidie gemeente", "BANK_IMPORT", fyId, [
      { accountId: acc("1000"), debit: amount },
      { accountId: acc("8200"), credit: amount },
    ]);
    events.push({
      date: d,
      category: "income",
      title: `Gemeentesubsidie ontvangen — ${dateLabel(d)} (${fmt(amount)})`,
      detail: `De gemeente subsidieert de fanfare als culturele instelling. Het bedrag van ${fmt(amount)} wordt rechtstreeks op de bankrekening gestort. Subsidies zijn een onzekere inkomstenbron; ze moeten ieder jaar opnieuw worden aangevraagd.`,
      entry: "Debet 1000 Bank / Kas — Credit 8200 Subsidies & Sponsoring",
      type: "BANK_IMPORT",
    });
  }

  // Step 7: Volunteer fundraising (3–5×)
  onProgress("Vrijwilligersacties aanmaken...");
  const actionMonths = [2, 3, 5, 6, 9, 10, 11].filter((m) => !isCurrentYear || m <= maxMonth);
  const numActions = Math.min(rand(3, 5), actionMonths.length);
  const usedActionMonths = new Set();
  for (let i = 0; i < numActions; i++) {
    let month;
    do { month = actionMonths[rand(0, actionMonths.length - 1)]; } while (usedActionMonths.has(month));
    usedActionMonths.add(month);
    const amount = rand(300, 800);
    const actie = VRIJWILLIGER_ACTIES[rand(0, VRIJWILLIGER_ACTIES.length - 1)];
    const d = fmtDate(year, month, rand(1, 25)); if (!dateOk(d)) continue;
    await createTx(d, `Opbrengst ${actie}`, "CASH_MUTATION", fyId, [
      { accountId: acc("1000"), debit: amount },
      { accountId: acc("8250"), credit: amount },
    ]);
    events.push({
      date: d,
      category: "income",
      title: `Vrijwilligersactie: ${actie} (${fmt(amount)})`,
      detail: `De fanfare organiseert een ${actie.toLowerCase()} om extra inkomsten te genereren. De opbrengst van ${fmt(amount)} wordt contant ingenomen en als kasboeking geregistreerd. Vrijwilligersacties zijn een belangrijke aanvullende inkomstenbron naast de contributies.`,
      entry: "Debet 1000 Bank / Kas — Credit 8250 Vrijwilligerswerk / Acties",
      type: "CASH_MUTATION",
    });
  }

  // Step 8: Concert ticket sales
  onProgress("Concertopbrengsten aanmaken...");
  const springConcert = rand(1500, 2500);
  const springDate = fmtDate(year, 5, rand(10, 25));
  if (dateOk(springDate))
  await createTx(springDate, "Kaartverkoop voorjaarsconcert", "CASH_MUTATION", fyId, [
    { accountId: acc("1000"), debit: springConcert },
    { accountId: acc("8300"), credit: springConcert },
  ]);
  events.push({
    date: springDate,
    category: "income",
    title: `Voorjaarsconcert — kaartverkoop (${fmt(springConcert)})`,
    detail: `Het voorjaarsconcert brengt ${fmt(springConcert)} op aan kaartverkoop. De inkomsten worden contant ontvangen aan de deur. Concertopbrengsten zijn een significante maar onregelmatige inkomstenbron.`,
    entry: "Debet 1000 Bank / Kas — Credit 8300 Optredens & Concerten",
    type: "CASH_MUTATION",
  });

  const winterConcert = rand(1800, 3000);
  const winterMonth = randMonth(11, 12);
  const winterDate = winterMonth ? fmtDate(year, winterMonth, rand(1, 20)) : null;
  if (winterDate && dateOk(winterDate))
  await createTx(winterDate, "Kaartverkoop winterconcert", "CASH_MUTATION", fyId, [
    { accountId: acc("1000"), debit: winterConcert },
    { accountId: acc("8300"), credit: winterConcert },
  ]);
  if (winterDate && dateOk(winterDate)) events.push({
    date: winterDate,
    category: "income",
    title: `Winterconcert — kaartverkoop (${fmt(winterConcert)})`,
    detail: `Het winterconcert in ${MAANDEN[winterMonth - 1]} brengt ${fmt(winterConcert)} op. Dit is doorgaans het grootste concert van het jaar. De opbrengst is hoger dan bij het voorjaarsconcert doordat er meer bezoekers zijn.`,
    entry: "Debet 1000 Bank / Kas — Credit 8300 Optredens & Concerten",
    type: "CASH_MUTATION",
  });

  // Step 9: Drinks for members (4–8×)
  onProgress("Consumpties aanmaken...");
  const numDrinks = rand(4, 8);
  const drinkEvents = [];
  for (let i = 0; i < numDrinks; i++) {
    const m = randMonth(1, 12); if (!m) continue;
    const amount = rand(50, 150);
    const d = fmtDate(year, m, rand(1, 28)); if (!dateOk(d)) continue;
    await createTx(d, "Consumptie leden na repetitie", "CASH_MUTATION", fyId, [
      { accountId: acc("4700"), debit: amount },
      { accountId: acc("1000"), credit: amount },
    ]);
    drinkEvents.push({ date: d, amount });
  }
  const totalDrinks = drinkEvents.reduce((s, e) => s + e.amount, 0);
  events.push({
    date: drinkEvents[0].date,
    category: "expense",
    title: `Consumpties voor leden na repetitie (${numDrinks}× — totaal ${fmt(totalDrinks)})`,
    detail: `Na ${numDrinks} repetities trakteert de fanfare de leden op een drankje. Dit is een kleine maar regelmatige uitgave die de sociale cohesie bevordert. De bedragen variëren van ${fmt(Math.min(...drinkEvents.map(e => e.amount)))} tot ${fmt(Math.max(...drinkEvents.map(e => e.amount)))} per keer.`,
    entry: "Debet 4700 Activiteitencommissie — Credit 1000 Bank / Kas",
    type: "CASH_MUTATION",
  });

  // Step 10: Conductor — quarterly advance + monthly cost recognition
  onProgress("Dirigentbetalingen aanmaken...");
  const conductorRate = rand(80, 95);
  const monthlyAdvance = conductorRate * 4;
  const quarters = [
    { startMonth: 1, label: "Q1 (jan-mrt)" },
    { startMonth: 4, label: "Q2 (apr-jun)" },
    { startMonth: 7, label: "Q3 (jul-sep)" },
    { startMonth: 10, label: "Q4 (okt-dec)" },
  ];

  for (const { startMonth, label } of quarters) {
    const quarterTotal = monthlyAdvance * 3;
    const d = fmtDate(year, startMonth, 1); if (!dateOk(d)) continue;
    await createTx(d, `Voorschot dirigent ${label}`, "BANK_IMPORT", fyId, [
      { accountId: acc("1401"), debit: quarterTotal },
      { accountId: acc("1000"), credit: quarterTotal },
    ]);
    events.push({
      date: d,
      category: "advance",
      title: `Kwartaalvoorschot dirigent ${label} (${fmt(quarterTotal)})`,
      detail: `De dirigent wordt betaald voor 4 repetities per maand à ${fmt(conductorRate)} per repetitie = ${fmt(monthlyAdvance)}/maand. Het voorschot wordt 3 maanden vooruit betaald (${fmt(quarterTotal)}). Omdat de dienst nog geleverd moet worden, gaat het bedrag naar de tussenrekening "Vooruitbetaald: Dirigent A" (1601) — niet direct naar de kostenrekening. Dit heet een transitorische post.`,
      entry: "Debet 1401 Vooruitbetaald: Dirigent A — Credit 1000 Bank / Kas",
      type: "BANK_IMPORT",
    });
  }

  for (let month = 1; month <= maxMonth; month++) {
    const lastDay = new Date(year, month, 0).getDate();
    const d = fmtDate(year, month, lastDay); if (!dateOk(d)) continue;
    await createTx(d, `Kosten dirigent ${MAANDEN[month - 1]}`, "MEMORIAL", fyId, [
      { accountId: acc("4000"), debit: monthlyAdvance },
      { accountId: acc("1401"), credit: monthlyAdvance },
    ]);
    events.push({
      date: d,
      category: "recognition",
      title: `Kostenverantwoording dirigent — ${MAANDEN[month - 1]} (${fmt(monthlyAdvance)})`,
      detail: `Aan het einde van ${MAANDEN[month - 1]} is de dienst geleverd: de dirigent heeft 4 repetities geleid. Nu wordt ${fmt(monthlyAdvance)} van de vooruitbetaalde rekening (1601) overgeboekt naar de eigenlijke kostenrekening (4000). Dit is een memoriaalpost — er gaat geen geld naar de bank.`,
      entry: "Debet 4000 Kosten Dirigent — Credit 1401 Vooruitbetaald: Dirigent A",
      type: "MEMORIAL",
    });
  }

  // Extra rehearsals (0–2×)
  const numExtra = rand(0, 2);
  for (let i = 0; i < numExtra; i++) {
    const amount = rand(85, 110);
    const m = randMonth(1, 12); if (!m) continue;
    const d = fmtDate(year, m, rand(1, 28)); if (!dateOk(d)) continue;
    await createTx(d, "Extra repetitie dirigent", "BANK_IMPORT", fyId, [
      { accountId: acc("4000"), debit: amount },
      { accountId: acc("1000"), credit: amount },
    ]);
    events.push({
      date: d,
      category: "expense",
      title: `Extra repetitie dirigent — ${dateLabel(d)} (${fmt(amount)})`,
      detail: `Er is een extra repetitie ingepland, bijvoorbeeld voor een bijzonder optreden. Deze valt buiten het kwartaalvoorschot en wordt achteraf direct als kosten geboekt — zonder tussenrekening, omdat het geen vooruitbetaling is.`,
      entry: "Debet 4000 Kosten Dirigent — Credit 1000 Bank / Kas",
      type: "BANK_IMPORT",
    });
  }

  // Instrumentarium: aankoop instrument(en) + jaarlijkse afschrijving
  onProgress("Instrumentarium aanmaken...");
  const instrBedrag = rand(3000, 7500);
  const instrM = randMonth(3, 8);
  const instrDatum = instrM ? fmtDate(year, instrM, rand(1, 28)) : null;
  if (instrDatum && dateOk(instrDatum))
  await createTx(instrDatum, "Aankoop instrument(en)", "BANK_IMPORT", fyId, [
    { accountId: acc("0200"), debit: instrBedrag },
    { accountId: acc("1000"), credit: instrBedrag },
  ]);
  if (instrDatum && dateOk(instrDatum)) events.push({
    date: instrDatum,
    category: "expense",
    title: `Aankoop instrumentarium (${fmt(instrBedrag)})`,
    detail: `De fanfare heeft nieuwe instrumenten aangeschaft voor ${fmt(instrBedrag)}. Het bedrag wordt geactiveerd op rekening 0200 Instrumentarium (vaste activa) en betaald via de bankrekening.`,
    entry: `Debet 0200 Instrumentarium — Credit 1000 Bank / Kas`,
    type: "BANK_IMPORT",
  });
  const afschrijving = Math.round(instrBedrag * 0.10);
  const afschrijvingDatum = fmtDate(year, 12, 31);
  if (dateOk(afschrijvingDatum))
  await createTx(afschrijvingDatum, "Afschrijving instrumentarium", "MEMORIAL", fyId, [
    { accountId: acc("4400"), debit: afschrijving },
    { accountId: acc("0200"), credit: afschrijving },
  ]);
  if (dateOk(afschrijvingDatum)) events.push({
    date: afschrijvingDatum,
    category: "expense",
    title: `Afschrijving instrumentarium 10% (${fmt(afschrijving)})`,
    detail: `Aan het einde van het boekjaar wordt het instrumentarium voor 10% afgeschreven (${fmt(afschrijving)}). De afschrijving is een niet-kasonkost: er gaat geen geld van de bank, maar de waarde van het activum daalt en de kosten worden verantwoord op de resultatenrekening.`,
    entry: `Debet 4400 Afschrijving Instrumenten — Credit 0200 Instrumentarium`,
    type: "MEMORIAL",
  });

  // Uitstaande lening aan de beheerstichting
  onProgress("Lening beheerstichting aanmaken...");
  const leningBedrag = rand(5000, 10000);
  const leningM = randMonth(1, 3);
  const leningDatum = leningM ? fmtDate(year, leningM, rand(1, 28)) : null;
  if (leningDatum && dateOk(leningDatum)) {
  await createTx(leningDatum, "Lening verstrekt aan Beheerstichting", "BANK_IMPORT", fyId, [
    { accountId: acc("0900"), debit: leningBedrag },
    { accountId: acc("1000"), credit: leningBedrag },
  ]);
  events.push({
    date: leningDatum,
    category: "neutral",
    title: `Lening verstrekt aan Beheerstichting (${fmt(leningBedrag)})`,
    detail: `De fanfare verstrekt een lening van ${fmt(leningBedrag)} aan de Beheerstichting voor onderhoud of investering in de accommodatie. Het bedrag wordt afgeschreven van de bankrekening en staat als vordering op rekening 0900 Lening u/g Beheerstichting (financiële vaste activa). De lening staat aan het einde van het boekjaar nog volledig open.`,
    entry: `Debet 0900 Lening u/g Beheerstichting — Credit 1000 Bank / Kas`,
    type: "BANK_IMPORT",
  });
  }

  // Sort events by date
  events.sort((a, b) => a.date.localeCompare(b.date));

  onProgress("Klaar!");
  return events;
}

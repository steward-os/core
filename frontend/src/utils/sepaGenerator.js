/**
 * SEPA PAIN.008 (Direct Debit) XML Generator
 */

/**
 * Escapes special XML characters
 */
function escapeXml(unsafe) {
  if (!unsafe) return "";
  return unsafe
    .replace(/[<>&"']/g, (c) => {
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

/**
 * Generates a SEPA PAIN.008 XML string
 * 
 * @param {Object} creditor - Creditor information
 * @param {string} creditor.name - Creditor name
 * @param {string} creditor.iban - Creditor IBAN
 * @param {string} creditor.id - SEPA Creditor ID (e.g. NL00ZZZ000000000000)
 * @param {string} creditor.bic - Creditor BIC (optional)
 * @param {Object} payment - Payment information
 * @param {string} payment.id - Unique payment ID (MsgId)
 * @param {string} payment.date - Collection date (YYYY-MM-DD)
 * @param {string} payment.description - General payment description
 * @param {Array<Object>} debtors - List of debtors (members)
 * @param {string} debtors[].name - Debtor account holder name
 * @param {string} debtors[].iban - Debtor IBAN
 * @param {string} debtors[].mandateId - Mandate reference
 * @param {number} debtors[].amount - Amount to collect
 * @param {string} debtors[].description - Individual description (optional)
 */
export function generateSepaSdd(creditor, payment, debtors) {
  const timestamp = new Date().toISOString().replace(/\.[0-9]{3}/, "");
  const totalAmount = debtors.reduce((sum, d) => sum + d.amount, 0).toFixed(2);
  const numberOfTransactions = debtors.length;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.008.001.02" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <CstmrDrctDbtInitn>
    <GrpHdr>
      <MsgId>${escapeXml(payment.id)}</MsgId>
      <CreDtTm>${timestamp}</CreDtTm>
      <NbOfTxs>${numberOfTransactions}</NbOfTxs>
      <CtrlSum>${totalAmount}</CtrlSum>
      <InitgPty>
        <Nm>${escapeXml(creditor.name)}</Nm>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${escapeXml(payment.id)}</PmtInfId>
      <PmtMtd>DD</PmtMtd>
      <NbOfTxs>${numberOfTransactions}</NbOfTxs>
      <CtrlSum>${totalAmount}</CtrlSum>
      <PmtTpInf>
        <SvcLvl>
          <Cd>SEPA</Cd>
        </SvcLvl>
        <LclInstrm>
          <Cd>CORE</Cd>
        </LclInstrm>
        <SeqTp>OOFF</SeqTp>
      </PmtTpInf>
      <ReqdColltnDt>${payment.date}</ReqdColltnDt>
      <Cdtr>
        <Nm>${escapeXml(creditor.name)}</Nm>
      </Cdtr>
      <CdtrAcct>
        <Id>
          <IBAN>${creditor.iban.replace(/\s/g, "")}</IBAN>
        </Id>
      </CdtrAcct>
      <CdtrAgt>
        <FinInstnId>
          ${creditor.bic ? `<BIC>${creditor.bic.replace(/\s/g, "")}</BIC>` : `<Othr><Id>NOTPROVIDED</Id></Othr>`}
        </FinInstnId>
      </CdtrAgt>
      <ChrgBr>SLEV</ChrgBr>
      <CdtrSchmeId>
        <Id>
          <PrvtId>
            <Othr>
              <Id>${escapeXml(creditor.id)}</Id>
              <SchmeNm>
                <Prtry>SEPA</Prtry>
              </SchmeNm>
            </Othr>
          </PrvtId>
        </Id>
      </CdtrSchmeId>`;

  debtors.forEach((debtor, index) => {
    const drMsgId = `${payment.id}-${index + 1}`;
    xml += `
      <DrctDbtTxInf>
        <PmtId>
          <InstrId>${escapeXml(drMsgId)}</InstrId>
          <EndToEndId>${escapeXml(drMsgId)}</EndToEndId>
        </PmtId>
        <InstdAmt Ccy="EUR">${debtor.amount.toFixed(2)}</InstdAmt>
        <DrctDbtTx>
          <MndtRltdInf>
            <MndtId>${escapeXml(debtor.mandateId)}</MndtId>
            <DtOfSgntr>${payment.date}</DtOfSgntr>
            <AmdmntInd>false</AmdmntInd>
          </MndtRltdInf>
        </DrctDbtTx>
        <DbtrAgt>
          <FinInstnId>
            <Othr>
              <Id>NOTPROVIDED</Id>
            </Othr>
          </FinInstnId>
        </DbtrAgt>
        <Dbtr>
          <Nm>${escapeXml(debtor.name)}</Nm>
        </Dbtr>
        <DbtrAcct>
          <Id>
            <IBAN>${debtor.iban.replace(/\s/g, "")}</IBAN>
          </Id>
        </DbtrAcct>
        <RmtInf>
          <Ustrd>${escapeXml(debtor.description || payment.description)}</Ustrd>
        </RmtInf>
      </DrctDbtTxInf>`;
  });

  xml += `
    </PmtInf>
  </CstmrDrctDbtInitn>
</Document>`;

  return xml;
}

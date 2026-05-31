import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BackButton } from "../../../components/Button/BackButton";
import { EditButton } from "../../../components/Button/EditButton";
import PageContent from "../../../components/Page/PageContent";
import PageHeader from "../../../components/Page/PageHeader";
import LedgerAccountDetailView from "./LedgerAccountDetailView";

const LedgerAccountDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [account, setAccount] = useState(null);

  return (
    <PageContent fullWidth>
      <PageHeader
        title={account ? `${account.account_number} – ${account.name}` : "Grootboekrekening detail"}
        backButton={
          <BackButton
            onClick={() => navigate(`/finance/ledger-accounts?${searchParams.toString()}`)}
            ariaLabel="Terug naar grootboekrekeningen"
          />
        }
      >
        <EditButton
          onClick={() => navigate(`/finance/ledger-accounts/${id}/edit?${searchParams.toString()}`)}
          showText
          size="normal"
          ariaLabel="Rekening bewerken"
        />
      </PageHeader>

      <LedgerAccountDetailView accountId={id} onAccountLoaded={setAccount} />
    </PageContent>
  );
};

export default LedgerAccountDetail;

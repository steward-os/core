import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BackButton } from "../../../components/Button/BackButton";
import { Button } from "../../../components/Button/Button";
import { CloseButton } from "../../../components/Button/CloseButton";
import CenteredAlert from "../../../components/CenteredAlert";
import CenteredSpinner from "../../../components/CenteredSpinner";
import DetailBlock, { Label, Row } from "../../../components/Detail/DetailBlock";
import DetailCard from "../../../components/Detail/DetailCard";
import Checkbox from "../../../components/Form/Checkbox";
import Input from "../../../components/Form/Input";
import Select from "../../../components/Form/Select";
import PageContent from "../../../components/Page/PageContent";
import PageHeader from "../../../components/Page/PageHeader";
import { useCreateLedgerAccount, useUpdateLedgerAccount } from "../../../hooks/crudResourceHooks";
import { getLedgerAccount } from "../../../services/ledgerAccountService";
import { CATEGORY_OPTIONS, SUB_CATEGORY_OPTIONS_BY_CATEGORY } from "../../../utils/financeConstants";

const LedgerAccountEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isCreateMode = !id;
  const createMutation = useCreateLedgerAccount();
  const updateMutation = useUpdateLedgerAccount();

  const [loading, setLoading] = useState(!isCreateMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    account_number: "",
    name: "",
    category: "",
    sub_category: "",
    is_system: false,
    is_bank_account: false,
    is_suspense_account: false,
  });

  useEffect(() => {
    if (isCreateMode) return;
    setLoading(true);
    getLedgerAccount(id)
      .then((data) => {
        setFormData({
          account_number: data.account_number || "",
          name: data.name || "",
          category: data.category || "",
          sub_category: data.sub_category || "",
          is_system: !!data.is_system,
          is_bank_account: !!data.is_bank_account,
          is_suspense_account: !!data.is_suspense_account,
        });
      })
      .catch((err) => {
        if (!err?.isAbort) setError(err?.message || "Grootboekrekening niet gevonden.");
      })
      .finally(() => setLoading(false));
  }, [id, isCreateMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isCreateMode) {
        await createMutation.mutateAsync(formData);
        navigate(`/finance/ledger-accounts?${searchParams.toString()}`);
      } else {
        await updateMutation.mutateAsync({ id, data: formData });
        navigate(`/finance/ledger-accounts?${searchParams.toString()}`);
      }
    } catch (err) {
      console.error("Error saving ledger account:", err);
      alert("Er is een fout opgetreden bij het opslaan.");
    }
    setSaving(false);
  };

  if (loading) return <CenteredSpinner />;
  if (error) return <CenteredAlert text={error} />;

  return (
    <PageContent fullWidth>
      <PageHeader
        title={isCreateMode ? "Nieuwe grootboekrekening" : "Grootboekrekening bewerken"}
        variant="edit"
        backButton={
          <BackButton onClick={() => navigate(`/finance/ledger-accounts?${searchParams.toString()}`)} ariaLabel="Terug naar grootboekrekeningen" />
        }
      >
        <CloseButton
          onClick={() => navigate(`/finance/ledger-accounts?${searchParams.toString()}`)}
          size="normal"
          ariaLabel="Annuleren"
        />
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        <DetailCard title="Rekeninggegevens">
          <DetailBlock>
            <Row>
              <Label htmlFor="account_number" required>
                Rekeningnummer
              </Label>
              <Input
                id="account_number"
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                placeholder="Bijv. 1000"
                required
              />
            </Row>

            <Row>
              <Label htmlFor="name" required>
                Naam
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Naam van de rekening"
                required
              />
            </Row>

            <Row>
              <Label htmlFor="category">Categorie</Label>
              <Select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value, sub_category: "" })}
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </Row>

            <Row>
              <Label htmlFor="sub_category">Sub-categorie</Label>
              <Select
                id="sub_category"
                value={formData.sub_category}
                onChange={(e) => setFormData({ ...formData, sub_category: e.target.value })}
                disabled={!formData.category}
              >
                <option value="">Selecteer sub-categorie</option>
                {(SUB_CATEGORY_OPTIONS_BY_CATEGORY[formData.category] || []).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </Row>
            <Row>
              <Label htmlFor="is_bank_account">Bankrekening</Label>
              <div className="pt-1">
                <Checkbox
                  id="is_bank_account"
                  checked={formData.is_bank_account}
                  onChange={(e) => setFormData({ ...formData, is_bank_account: e.target.checked })}
                />
              </div>
            </Row>
            <Row>
              <Label htmlFor="is_suspense_account">Tussenrekening</Label>
              <div className="pt-1">
                <Checkbox
                  id="is_suspense_account"
                  checked={formData.is_suspense_account}
                  onChange={(e) => setFormData({ ...formData, is_suspense_account: e.target.checked })}
                />
              </div>
            </Row>
            <Row>
              <Label htmlFor="is_system">Systeemrekening</Label>
              <div className="pt-1">
                <Checkbox
                  id="is_system"
                  checked={formData.is_system}
                  onChange={(e) => setFormData({ ...formData, is_system: e.target.checked })}
                />
              </div>
            </Row>
          </DetailBlock>
        </DetailCard>

        <div className="flex flex-col md:flex-row gap-3 pt-4">
          <Button
            type="button"
            onClick={() => navigate(`/finance/ledger-accounts?${searchParams.toString()}`)}
            color="gray"
            text="Annuleren"
            className="w-full md:w-auto md:min-w-[160px] justify-center"
          />
          <Button
            type="submit"
            disabled={saving}
            color="blue"
            text={saving ? "Opslaan..." : "Opslaan"}
            className="w-full md:w-auto md:min-w-[160px] justify-center"
          />
        </div>
      </form>
    </PageContent>
  );
};

export default LedgerAccountEdit;

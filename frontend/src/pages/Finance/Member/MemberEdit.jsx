import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BackButton } from "../../../components/Button/BackButton";
import { Button } from "../../../components/Button/Button";
import { CloseButton } from "../../../components/Button/CloseButton";
import CenteredAlert from "../../../components/CenteredAlert";
import CenteredSpinner from "../../../components/CenteredSpinner";
import DetailBlock, { Label, Row } from "../../../components/Detail/DetailBlock";
import DetailCard from "../../../components/Detail/DetailCard";
import Input from "../../../components/Form/Input";
import TagSelector from "../../../components/Form/TagSelector";
import PageContent from "../../../components/Page/PageContent";
import PageHeader from "../../../components/Page/PageHeader";
import { useCreateMember, useMember, useUpdateMember } from "../../../hooks/crudResourceHooks";

const MemberEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isCreateMode = !id;
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        salutation: "",
        initials: "",
        first_name: "",
        last_name: "",
        organisation: "",
        email: "",
        telephone: "",
        address1: "",
        address2: "",
        city: "",
        zip: "",
        country: "",
        account_holder_name: "",
        iban: "",
        mandate_reference: "",
    });

    const { data: member, isLoading, error } = useMember(id, {}, { enabled: !isCreateMode });
    const createMemberMutation = useCreateMember();
    const updateMemberMutation = useUpdateMember();
    useEffect(() => {
        if (member && !isCreateMode) {
            setFormData({
                salutation: member.salutation || "",
                initials: member.initials || "",
                first_name: member.first_name || "",
                last_name: member.last_name || "",
                organisation: member.organisation || "",
                email: member.email || "",
                telephone: member.telephone || "",
                address1: member.address1 || " ",
                address2: member.address2 || "",
                city: member.city || "",
                zip: member.zip || "",
                country: member.country || "",
                account_holder_name: member.account_holder_name || "",
                iban: member.iban || "",
                mandate_reference: member.mandate_reference || "",
            });
        }
    }, [member, isCreateMode]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.first_name.trim() && !formData.last_name.trim()) {
            alert("Vul minimaal een voor- of achternaam in.");
            return;
        }

        setSaving(true);
        try {
            const memberData = {
                salutation: formData.salutation.trim() || null,
                initials: formData.initials.trim() || null,
                first_name: formData.first_name.trim() || null,
                last_name: formData.last_name.trim() || null,
                organisation: formData.organisation.trim() || null,
                email: formData.email.trim() || null,
                telephone: formData.telephone.trim() || null,
                address1: formData.address1.trim() || null,
                address2: formData.address2.trim() || null,
                city: formData.city.trim() || null,
                zip: formData.zip.trim() || null,
                country: formData.country.trim() || null,
                account_holder_name: formData.account_holder_name.trim() || null,
                iban: formData.iban.trim() || null,
                mandate_reference: formData.mandate_reference.trim() || null,
                is_member: true,
            };

            if (isCreateMode) {
                const result = await createMemberMutation.mutateAsync(memberData);
                navigate(`/finance/members/${result.id}?${searchParams.toString()}`);
            } else {
                await updateMemberMutation.mutateAsync({ id, data: memberData });
                navigate(`/finance/members/${id}?${searchParams.toString()}`);
            }
        } catch (error) {
            console.error("Error saving member:", error);
            alert("Er is een fout opgetreden bij het opslaan van het lid.");
        }
        setSaving(false);
    };

    if (isLoading) {
        return <CenteredSpinner />;
    }

    if (!isCreateMode && error) {
        return <CenteredAlert text={`Fout bij laden: ${error.message}`} />;
    }

    if (!isCreateMode && !member && !isLoading) {
        return <CenteredAlert text="Lid niet gevonden." />;
    }

    const field = (key) => ({
        value: formData[key],
        onChange: (e) => setFormData({ ...formData, [key]: e.target.value }),
    });

    return (
        <PageContent fullWidth>
            <PageHeader
                title={isCreateMode ? "Nieuw lid" : "Lid bewerken"}
                variant="edit"
                backButton={
                    <BackButton
                        onClick={() =>
                            navigate(
                                isCreateMode ? "/finance/members" : `/finance/members/${id}?${searchParams.toString()}`,
                            )
                        }
                        ariaLabel="Terug"
                    />
                }
            >
                <CloseButton
                    onClick={() =>
                        navigate(
                            isCreateMode ? "/finance/members" : `/finance/members/${id}?${searchParams.toString()}`,
                        )
                    }
                    size="normal"
                    ariaLabel="Annuleren"
                />
            </PageHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
                <DetailCard title="Contactinformatie">
                    <DetailBlock>
                        <Row><Label htmlFor="salutation">Aanhef</Label><Input id="salutation" name="salutation" placeholder="Dhr./Mevr./Anders" {...field("salutation")} /></Row>
                        <Row><Label htmlFor="initials">Initialen</Label><Input id="initials" name="initials" placeholder="J.A." {...field("initials")} /></Row>
                        <Row><Label htmlFor="first_name">Voornaam</Label><Input id="first_name" name="first_name" placeholder="Voornaam" {...field("first_name")} /></Row>
                        <Row><Label htmlFor="last_name">Achternaam</Label><Input id="last_name" name="last_name" placeholder="Achternaam" {...field("last_name")} /></Row>
                        <Row><Label htmlFor="organisation">Organisatie</Label><Input id="organisation" name="organisation" placeholder="Organisatienaam" {...field("organisation")} /></Row>
                        <Row><Label htmlFor="email">E-mailadres</Label><Input id="email" name="email" type="email" placeholder="naam@voorbeeld.nl" {...field("email")} /></Row>
                        <Row><Label htmlFor="telephone">Telefoonnummer</Label><Input id="telephone" name="telephone" type="tel" placeholder="06-12345678" {...field("telephone")} /></Row>
                    </DetailBlock>
                    <DetailBlock title="Adresgegevens">
                        <Row><Label htmlFor="address1">Adres 1</Label><Input id="address1" name="address1" placeholder="Straatnaam en huisnummer" {...field("address1")} /></Row>
                        <Row><Label htmlFor="address2">Adres 2</Label><Input id="address2" name="address2" placeholder="Bijv. appartement, toevoeging" {...field("address2")} /></Row>
                        <Row><Label htmlFor="zip">Postcode</Label><Input id="zip" name="zip" placeholder="1234AB" {...field("zip")} /></Row>
                        <Row><Label htmlFor="city">Plaats</Label><Input id="city" name="city" placeholder="Plaatsnaam" {...field("city")} /></Row>
                        <Row><Label htmlFor="country">Land</Label><Input id="country" name="country" placeholder="Nederland" {...field("country")} /></Row>
                    </DetailBlock>
                    <DetailBlock title="Betaalgegevens">
                        <Row><Label htmlFor="account_holder_name">Rekeninghouder</Label><Input id="account_holder_name" name="account_holder_name" placeholder="Naam rekeninghouder" {...field("account_holder_name")} /></Row>
                        <Row><Label htmlFor="iban">IBAN</Label><Input id="iban" name="iban" placeholder="NL00 BANK 0123 4567 89" {...field("iban")} /></Row>
                        <Row><Label htmlFor="mandate_reference">Mandaat kenmerk</Label><Input id="mandate_reference" name="mandate_reference" placeholder="Kenmerk automatische incasso" {...field("mandate_reference")} /></Row>
                    </DetailBlock>
                </DetailCard>

                <DetailCard title="Tags">
                    <div className="flex-1">
                        <TagSelector
                            type="relation"
                            item={member}
                            placeholder="Type om tags te zoeken en selecteren..."
                        />
                    </div>
                </DetailCard>

                <div className="flex flex-col md:flex-row gap-3 pt-4">
                    <Button
                        type="button"
                        onClick={() =>
                            navigate(
                                isCreateMode
                                    ? "/finance/members"
                                    : `/finance/members/${id}?${searchParams.toString()}`,
                            )
                        }
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

export default MemberEdit;

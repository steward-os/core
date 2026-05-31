import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BackButton } from "../../../components/Button/BackButton";
import { DeleteButton } from "../../../components/Button/DeleteButton";
import { EditButton } from "../../../components/Button/EditButton";
import CenteredAlert from "../../../components/CenteredAlert";
import CenteredSpinner from "../../../components/CenteredSpinner";
import DetailBlock, { Label, Row, Value } from "../../../components/Detail/DetailBlock";
import DetailCard from "../../../components/Detail/DetailCard";
import PageContent from "../../../components/Page/PageContent";
import PageHeader from "../../../components/Page/PageHeader";
import RelationNotes from "../../../components/RelationNotes";
import { useDeleteMember, useMember } from "../../../hooks/crudResourceHooks";
import { useTagsForRelation } from "../../../hooks/useRelationTagQuery";

const MemberDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const deleteMemberMutation = useDeleteMember();

    const { data: member, isLoading, error } = useMember(id);
    const { data: memberTags, isLoading: tagsLoading } = useTagsForRelation(id);

    const handleDelete = async () => {
        if (!window.confirm("Weet je zeker dat je dit lid wilt verwijderen?")) {
            return;
        }

        try {
            await deleteMemberMutation.mutateAsync(id);
            navigate(`/finance/members?${searchParams.toString()}`);
        } catch (error) {
            console.error("Error deleting member:", error);
            alert("Er is een fout opgetreden bij het verwijderen van het lid.");
        }
    };

    if (isLoading) {
        return <CenteredSpinner />;
    }

    if (error) {
        return <CenteredAlert text={`Fout bij laden: ${error.message}`} />;
    }

    if (!member) {
        return <CenteredAlert text="Lid niet gevonden." />;
    }

    const fullName = [member.first_name, member.last_name].filter(Boolean).join(" ") || "-";
    const fullAddress = [member.address1, member.address2].filter(Boolean).join(", ") || "-";

    return (
        <PageContent fullWidth>
            <PageHeader
                title={fullName}
                backButton={
                    <BackButton
                        onClick={() => navigate(`/finance/members?${searchParams.toString()}`)}
                        ariaLabel="Terug naar leden"
                    />
                }
            >
                <EditButton
                    onClick={() => navigate(`/finance/members/${id}/edit?${searchParams.toString()}`)}
                    showText
                    size="normal"
                    ariaLabel="Lid bewerken"
                />
                <DeleteButton onClick={handleDelete} showText size="normal" ariaLabel="Lid verwijderen" />
            </PageHeader>

            <div className="space-y-6">
                <DetailCard title="Contactinformatie">
                    <DetailBlock>
                        <Row>
                            <Label>Aanhef</Label>
                            <Value>{member.salutation || "-"}</Value>
                        </Row>
                        <Row>
                            <Label>Initialen</Label>
                            <Value>{member.initials || "-"}</Value>
                        </Row>
                        <Row>
                            <Label>Voornaam</Label>
                            <Value>{member.first_name || "-"}</Value>
                        </Row>
                        <Row>
                            <Label>Achternaam</Label>
                            <Value>{member.last_name || "-"}</Value>
                        </Row>
                        <Row>
                            <Label>Organisatie</Label>
                            <Value>{member.organisation || "-"}</Value>
                        </Row>
                        <Row>
                            <Label>Lid</Label>
                            <Value>{member.is_member ? "Ja" : "Nee"}</Value>
                        </Row>
                        <Row>
                            <Label>E-mailadres</Label>
                            <Value>
                                {member.email ? (
                                    <a href={`mailto:${member.email}`} className="text-blue-600 hover:text-blue-800">
                                        {member.email}
                                    </a>
                                ) : (
                                    "-"
                                )}
                            </Value>
                        </Row>
                        <Row>
                            <Label>Telefoonnummer</Label>
                            <Value>
                                {member.telephone ? (
                                    <a href={`tel:${member.telephone}`} className="text-blue-600 hover:text-blue-800">
                                        {member.telephone}
                                    </a>
                                ) : (
                                    "-"
                                )}
                            </Value>
                        </Row>
                    </DetailBlock>

                    <DetailBlock title="Adresgegevens">
                        <Row>
                            <Label>Adres</Label>
                            <Value>{fullAddress}</Value>
                        </Row>
                        <Row>
                            <Label>Postcode</Label>
                            <Value>{member.zip || "-"}</Value>
                        </Row>
                        <Row>
                            <Label>Plaats</Label>
                            <Value>{member.city || "-"}</Value>
                        </Row>
                        <Row>
                            <Label>Land</Label>
                            <Value>{member.country || "-"}</Value>
                        </Row>
                    </DetailBlock>
                    <DetailBlock title="Betaalgegevens">
                        <Row>
                            <Label>Rekeninghouder</Label>
                            <Value>{member.account_holder_name || "-"}</Value>
                        </Row>
                        <Row>
                            <Label>IBAN</Label>
                            <Value>{member.iban || "-"}</Value>
                        </Row>
                        <Row>
                            <Label>Mandaat kenmerk</Label>
                            <Value>{member.mandate_reference || "-"}</Value>
                        </Row>
                    </DetailBlock>
                </DetailCard>

                <DetailCard title="Tags">
                    <div>
                        {tagsLoading ? (
                            <span className="text-[var(--text-secondary)]">Tags laden...</span>
                        ) : memberTags && memberTags.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {memberTags.map((tag) => (
                                    <span
                                        key={tag.id}
                                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                                    >
                                        {tag.name}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <span className="text-[var(--text-secondary)]">Geen tags toegewezen</span>
                        )}
                    </div>
                </DetailCard>

                <RelationNotes relationId={id} />
            </div>
        </PageContent>
    );
};

export default MemberDetail;

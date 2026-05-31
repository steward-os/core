import { useEffect, useState } from "react";
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
import { deleteParameter, getParameter } from "../../../services/parameterService";

const ParameterDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [parameter, setParameter] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchParameter = async () => {
            setLoading(true);
            try {
                const data = await getParameter(id);
                setParameter(data);
            } catch (error) {
                console.error("Error fetching parameter:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchParameter();
    }, [id]);

    const handleDelete = async () => {
        if (!window.confirm("Weet je zeker dat je deze parameter wilt verwijderen?")) return;
        try {
            await deleteParameter(id);
            navigate(`/parameters?${searchParams.toString()}`);
        } catch (error) {
            console.error("Error deleting parameter:", error);
            alert("Er is een fout opgetreden bij het verwijderen.");
        }
    };

    if (loading) return <CenteredSpinner />;
    if (!parameter) return <CenteredAlert text="Parameter niet gevonden." />;

    return (
        <PageContent fullWidth>
            <PageHeader
                title={parameter.name}
                backButton={
                    <BackButton onClick={() => navigate(`/parameters?${searchParams.toString()}`)} ariaLabel="Terug naar parameters" />
                }
            >
                <EditButton
                    onClick={() => navigate(`/parameters/${id}/edit?${searchParams.toString()}`)}
                    size="normal"
                    ariaLabel="Parameter bewerken"
                    showText
                />
                <DeleteButton onClick={handleDelete} size="normal" ariaLabel="Parameter verwijderen" showText />
            </PageHeader>

            <div className="space-y-6">
                <DetailCard title="Parameterdetails">
                    <DetailBlock>
                        <Row>
                            <Label>Naam</Label>
                            <Value>{parameter.name}</Value>
                        </Row>
                        <Row>
                            <Label>Waarde</Label>
                            <Value>{parameter.value}</Value>
                        </Row>
                        <Row>
                            <Label>Omschrijving</Label>
                            <Value>{parameter.description || "-"}</Value>
                        </Row>
                    </DetailBlock>
                </DetailCard>
            </div>
        </PageContent>
    );
};

export default ParameterDetail;

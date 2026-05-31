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
import { deleteMediaFile, getMediaFile, getMediaFileUrl } from "../../../services/mediaFileService";

const MediaFileDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [mediaFile, setMediaFile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMediaFile = async () => {
            setLoading(true);
            try {
                const data = await getMediaFile(id);
                setMediaFile(data);
            } catch (error) {
                console.error("Error fetching media file:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMediaFile();
    }, [id]);

    const handleDelete = async () => {
        if (!window.confirm("Weet je zeker dat je dit bestand wilt verwijderen?")) return;
        try {
            await deleteMediaFile(id);
            navigate(`/media-files?${searchParams.toString()}`);
        } catch (error) {
            console.error("Error deleting media file:", error);
            alert("Er is een fout opgetreden bij het verwijderen.");
        }
    };

    if (loading) return <CenteredSpinner />;
    if (!mediaFile) return <CenteredAlert text="Bestand niet gevonden." />;

    const fileUrl = getMediaFileUrl(mediaFile);

    return (
        <PageContent fullWidth>
            <PageHeader
                title={mediaFile.name}
                backButton={
                    <BackButton onClick={() => navigate(`/media-files?${searchParams.toString()}`)} ariaLabel="Terug naar bestanden" />
                }
            >
                <EditButton
                    onClick={() => navigate(`/media-files/${id}/edit?${searchParams.toString()}`)}
                    size="normal"
                    ariaLabel="Bestand bewerken"
                    showText
                />
                <DeleteButton onClick={handleDelete} size="normal" ariaLabel="Bestand verwijderen" showText />
            </PageHeader>

            <div className="space-y-6">
                <DetailCard title="Bestandsdetails">
                    <DetailBlock>
                        <Row>
                            <Label>Naam</Label>
                            <Value>{mediaFile.name}</Value>
                        </Row>
                        <Row>
                            <Label>Bestand</Label>
                            <Value>{mediaFile.file || "-"}</Value>
                        </Row>
                    </DetailBlock>
                </DetailCard>

                {fileUrl && (
                    <DetailCard title="Voorbeeld">
                        <img
                            src={fileUrl}
                            alt={mediaFile.name}
                            className="max-w-full max-h-96 rounded-lg object-contain"
                        />
                    </DetailCard>
                )}
            </div>
        </PageContent>
    );
};

export default MediaFileDetail;

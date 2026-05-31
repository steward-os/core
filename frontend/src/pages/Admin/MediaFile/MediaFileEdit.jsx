import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../../../components/Button/Button";
import { CloseButton } from "../../../components/Button/CloseButton";
import DetailBlock, { Label, Row } from "../../../components/Detail/DetailBlock";
import DetailCard from "../../../components/Detail/DetailCard";
import Input from "../../../components/Form/Input";
import PageContent from "../../../components/Page/PageContent";
import PageHeader from "../../../components/Page/PageHeader";
import { mediaFileSchema } from "../../../schemas/mediaFileSchema";
import { createMediaFile, getMediaFile, getMediaFileUrl, updateMediaFile } from "../../../services/mediaFileService";

const MediaFileEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = !id;
    const [saving, setSaving] = useState(false);
    const [currentFileUrl, setCurrentFileUrl] = useState(null);
    const fileInputRef = useRef(null);

    const form = useForm({
        resolver: zodResolver(mediaFileSchema),
        defaultValues: { name: "" },
    });

    useEffect(() => {
        if (!isNew) {
            const fetchMediaFile = async () => {
                try {
                    const record = await getMediaFile(id);
                    form.reset({ name: record.name || "" });
                    setCurrentFileUrl(getMediaFileUrl(record));
                } catch (error) {
                    console.error("Error fetching media file:", error);
                }
            };
            fetchMediaFile();
        }
    }, [id, isNew, form]);

    const onSubmit = async (data) => {
        const file = fileInputRef.current?.files?.[0];
        if (isNew && !file) {
            alert("Selecteer een bestand.");
            return;
        }

        setSaving(true);
        try {
            const fd = new FormData();
            fd.append("name", data.name);
            if (file) fd.append("file", file);

            if (isNew) {
                await createMediaFile(fd);
            } else {
                await updateMediaFile(id, fd);
            }
            navigate("/media-files");
        } catch (error) {
            console.error("Error saving media file:", error);
            alert("Er is een fout opgetreden bij het opslaan.");
        }
        setSaving(false);
    };

    return (
        <PageContent fullWidth>
            <PageHeader title={isNew ? "Nieuw bestand" : "Bestand bewerken"} variant="edit">
                <CloseButton onClick={() => navigate("/media-files")} size="normal" ariaLabel="Annuleren" />
            </PageHeader>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <DetailCard title="Bestandsgegevens">
                    <DetailBlock>
                        <Row>
                            <Label htmlFor="name">Naam</Label>
                            <Input
                                id="name"
                                {...form.register("name")}
                                placeholder="Naam van het bestand"
                                error={form.formState.errors.name?.message}
                                className="max-w-2xl"
                            />
                        </Row>
                        <Row>
                            <Label htmlFor="file">Bestand</Label>
                            <div>
                                {currentFileUrl && (
                                    <img
                                        src={currentFileUrl}
                                        alt="Huidig bestand"
                                        className="mb-3 max-h-32 rounded-lg object-contain"
                                    />
                                )}
                                <input
                                    id="file"
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="w-full max-w-2xl px-3 py-2 bg-[var(--glass-bg)] border border-black/20 dark:border-white/20 rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </Row>
                    </DetailBlock>
                </DetailCard>

                <div className="flex flex-col md:flex-row gap-3 pt-4">
                    <Button
                        type="button"
                        onClick={() => navigate("/media-files")}
                        color="gray"
                        text="Annuleren"
                        className="w-full md:w-auto md:min-w-[160px] justify-center"
                    />
                    <Button
                        type="submit"
                        disabled={saving || form.formState.isSubmitting}
                        color="blue"
                        text={saving ? "Opslaan..." : "Opslaan"}
                        className="w-full md:w-auto md:min-w-[160px] justify-center"
                    />
                </div>
            </form>
        </PageContent>
    );
};

export default MediaFileEdit;

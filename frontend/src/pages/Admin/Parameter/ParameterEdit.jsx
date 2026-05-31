import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../../../components/Button/Button";
import { CloseButton } from "../../../components/Button/CloseButton";
import DetailBlock, { Label, Row } from "../../../components/Detail/DetailBlock";
import DetailCard from "../../../components/Detail/DetailCard";
import Input from "../../../components/Form/Input";
import Textarea from "../../../components/Form/Textarea";
import PageContent from "../../../components/Page/PageContent";
import PageHeader from "../../../components/Page/PageHeader";
import { parameterSchema } from "../../../schemas/parameterSchema";
import { createParameter, getParameter, updateParameter } from "../../../services/parameterService";

const ParameterEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = !id;
    const [saving, setSaving] = useState(false);

    const form = useForm({
        resolver: zodResolver(parameterSchema),
        defaultValues: { name: "", value: "", description: "" },
    });

    useEffect(() => {
        if (!isNew) {
            const fetchParameter = async () => {
                try {
                    const param = await getParameter(id);
                    form.reset({
                        name: param.name || "",
                        value: param.value || "",
                        description: param.description || "",
                    });
                } catch (error) {
                    console.error("Error fetching parameter:", error);
                }
            };
            fetchParameter();
        }
    }, [id, isNew, form]);

    const onSubmit = async (data) => {
        setSaving(true);
        try {
            if (isNew) {
                await createParameter(data);
            } else {
                await updateParameter(id, data);
            }
            navigate("/parameters");
        } catch (error) {
            console.error("Error saving parameter:", error);
            alert("Er is een fout opgetreden bij het opslaan van de parameter.");
        }
        setSaving(false);
    };

    return (
        <PageContent fullWidth>
            <PageHeader title={isNew ? "Nieuwe parameter" : "Parameter bewerken"} variant="edit">
                <CloseButton onClick={() => navigate("/parameters")} size="normal" ariaLabel="Annuleren" />
            </PageHeader>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <DetailCard title="Parametergegevens">
                    <DetailBlock>
                        <Row>
                            <Label htmlFor="name">Naam</Label>
                            <Input
                                id="name"
                                {...form.register("name")}
                                placeholder="Naam van de parameter"
                                error={form.formState.errors.name?.message}
                                className="max-w-2xl"
                            />
                        </Row>
                        <Row>
                            <Label htmlFor="value">Waarde</Label>
                            <Input
                                id="value"
                                {...form.register("value")}
                                placeholder="Waarde van de parameter"
                                error={form.formState.errors.value?.message}
                                className="max-w-2xl"
                            />
                        </Row>
                        <Row>
                            <Label htmlFor="description">Omschrijving</Label>
                            <Textarea
                                id="description"
                                {...form.register("description")}
                                placeholder="Omschrijving van de parameter"
                                error={form.formState.errors.description?.message}
                                className="max-w-2xl"
                            />
                        </Row>
                    </DetailBlock>
                </DetailCard>

                <div className="flex flex-col md:flex-row gap-3 pt-4">
                    <Button
                        type="button"
                        onClick={() => navigate("/parameters")}
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

export default ParameterEdit;

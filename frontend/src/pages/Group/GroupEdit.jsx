import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getGroup, createGroup, updateGroup } from "../../services/groupService";
import { Button } from "../../components/Button/Button";
import Input from "../../components/Form/Input";
import Select from "../../components/Form/Select";
import PageHeader from "../../components/Page/PageHeader";
import PageContent from "../../components/Page/PageContent";
import { CloseButton } from "../../components/Button/CloseButton";
import DetailCard from "../../components/Detail/DetailCard";
import DetailBlock, { Row, Label } from "../../components/Detail/DetailBlock";
import { groupSchema, GROUP_TYPES } from "../../schemas/groupSchema";

const GroupEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;
  const [saving, setSaving] = useState(false);

  const form = useForm({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: "", type: "" },
  });

  useEffect(() => {
    if (!isNew) {
      const fetchGroup = async () => {
        try {
          const group = await getGroup(id);
          form.reset({ name: group.name || "", type: group.type || "" });
        } catch (error) {
          console.error("Error fetching group:", error);
        }
      };
      fetchGroup();
    }
  }, [id, isNew, form]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (isNew) {
        await createGroup(data);
      } else {
        await updateGroup(id, data);
      }
      navigate("/groups");
    } catch (error) {
      console.error("Error saving group:", error);
      alert("Er is een fout opgetreden bij het opslaan van de groep.");
    }
    setSaving(false);
  };

  return (
    <PageContent fullWidth>
      <PageHeader title={isNew ? "Nieuwe groep" : "Groep bewerken"} variant="edit">
        <CloseButton onClick={() => navigate("/groups")} size="normal" ariaLabel="Annuleren" />
      </PageHeader>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <DetailCard title="Groepsinformatie">
          <DetailBlock>
            <Row>
              <Label htmlFor="name">Naam</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Naam van de groep"
                error={form.formState.errors.name?.message}
                className="max-w-2xl"
              />
            </Row>
            <Row>
              <Label htmlFor="type">Type</Label>
              <Select
                id="type"
                {...form.register("type")}
                error={form.formState.errors.type?.message}
                className="max-w-2xl"
              >
                <option value="">Selecteer type</option>
                {GROUP_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Row>
          </DetailBlock>
        </DetailCard>

        <div className="flex flex-col md:flex-row gap-3 pt-4">
          <Button
            type="button"
            onClick={() => navigate("/groups")}
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

export default GroupEdit;

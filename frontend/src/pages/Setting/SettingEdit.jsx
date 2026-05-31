import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "../../components/Button/Button";
import { CloseButton } from "../../components/Button/CloseButton";
import DetailBlock, { Label, Row } from "../../components/Detail/DetailBlock";
import DetailCard from "../../components/Detail/DetailCard";
import Input from "../../components/Form/Input";
import CenteredAlert from "../../components/CenteredAlert";
import CenteredSpinner from "../../components/CenteredSpinner";
import PageContent from "../../components/Page/PageContent";
import PageHeader from "../../components/Page/PageHeader";
import { settingSchema } from "../../schemas/settingSchema";
import { createSetting, getSetting, getSettingFileUrl, updateSetting } from "../../services/settingService";

const SettingEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isCreateMode = !id;
  const [setting, setSetting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [icon192Url, setIcon192Url] = useState(null);
  const [icon512Url, setIcon512Url] = useState(null);
  const icon192Ref = useRef(null);
  const icon512Ref = useRef(null);

  const form = useForm({
    resolver: zodResolver(settingSchema),
    defaultValues: { app_name: "" },
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (!isCreateMode) {
          const data = await getSetting(id);
          setSetting(data);
          form.reset({ app_name: data.app_name || "" });
          setIcon192Url(getSettingFileUrl(data, "pwa_icon_192"));
          setIcon512Url(getSettingFileUrl(data, "pwa_icon_512"));
        }
      } catch (error) {
        console.error("Error fetching setting:", error);
      }
      setLoading(false);
    };
    loadData();
  }, [id, isCreateMode, form]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("app_name", data.app_name);
      const file192 = icon192Ref.current?.files?.[0];
      const file512 = icon512Ref.current?.files?.[0];
      if (file192) fd.append("pwa_icon_192", file192);
      if (file512) fd.append("pwa_icon_512", file512);

      if (isCreateMode) {
        const result = await createSetting(fd);
        navigate(`/settings/${result.id}?${searchParams.toString()}`);
      } else {
        await updateSetting(id, fd);
        navigate(`/settings/${id}?${searchParams.toString()}`);
      }
    } catch (error) {
      console.error("Error saving setting:", error);
      alert("Er is een fout opgetreden bij het opslaan.");
    }
    setSaving(false);
  };

  if (loading) return <CenteredSpinner />;
  if (!isCreateMode && !setting && !loading) return <CenteredAlert text="Instelling niet gevonden." />;

  return (
    <PageContent fullWidth>
      <PageHeader title={isCreateMode ? "Nieuwe instelling" : setting?.app_name || "Instelling bewerken"} variant="edit">
        <CloseButton
          onClick={() =>
            navigate(
              isCreateMode ? `/settings?${searchParams.toString()}` : `/settings/${id}?${searchParams.toString()}`
            )
          }
          size="normal"
          ariaLabel="Annuleren"
        />
      </PageHeader>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <DetailCard title="Instellingen">
          <DetailBlock>
            <Row>
              <Label htmlFor="app_name">App naam</Label>
              <Input
                id="app_name"
                {...form.register("app_name")}
                placeholder="Naam van de app"
                error={form.formState.errors.app_name?.message}
                className="max-w-2xl"
              />
            </Row>
            <Row>
              <Label htmlFor="pwa_icon_192">Icon 192px</Label>
              <div>
                {icon192Url && (
                  <img src={icon192Url} alt="Huidig icon 192px" className="mb-3 max-h-24 rounded object-contain" />
                )}
                <input
                  id="pwa_icon_192"
                  ref={icon192Ref}
                  type="file"
                  accept="image/*"
                  className="w-full max-w-2xl px-3 py-2 bg-[var(--glass-bg)] border border-black/20 dark:border-white/20 rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </Row>
            <Row>
              <Label htmlFor="pwa_icon_512">Icon 512px</Label>
              <div>
                {icon512Url && (
                  <img src={icon512Url} alt="Huidig icon 512px" className="mb-3 max-h-24 rounded object-contain" />
                )}
                <input
                  id="pwa_icon_512"
                  ref={icon512Ref}
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
            onClick={() =>
              navigate(
                isCreateMode ? `/settings?${searchParams.toString()}` : `/settings/${id}?${searchParams.toString()}`
              )
            }
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

export default SettingEdit;

import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BackButton } from "../../components/Button/BackButton";
import { DeleteButton } from "../../components/Button/DeleteButton";
import { EditButton } from "../../components/Button/EditButton";
import CenteredAlert from "../../components/CenteredAlert";
import CenteredSpinner from "../../components/CenteredSpinner";
import DetailBlock, { Label, Row, Value } from "../../components/Detail/DetailBlock";
import DetailCard from "../../components/Detail/DetailCard";
import PageContent from "../../components/Page/PageContent";
import PageHeader from "../../components/Page/PageHeader";
import { deleteSetting, getSetting, getSettingFileUrl } from "../../services/settingService";

const SettingDetail = ({ isAdmin }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [setting, setSetting] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSetting = async () => {
      setLoading(true);
      try {
        const data = await getSetting(id);
        setSetting(data);
      } catch (error) {
        console.error("Error fetching setting:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSetting();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Weet je zeker dat je deze instelling wilt verwijderen?")) return;
    try {
      await deleteSetting(id);
      navigate(`/settings?${searchParams.toString()}`);
    } catch (error) {
      console.error("Error deleting setting:", error);
      alert("Er is een fout opgetreden bij het verwijderen.");
    }
  };

  if (loading) return <CenteredSpinner />;
  if (!setting) return <CenteredAlert text="Instelling niet gevonden." />;

  const icon192Url = getSettingFileUrl(setting, "pwa_icon_192");
  const icon512Url = getSettingFileUrl(setting, "pwa_icon_512");

  return (
    <PageContent fullWidth>
      <PageHeader
        title={setting.app_name}
        backButton={
          <BackButton onClick={() => navigate(`/settings?${searchParams.toString()}`)} ariaLabel="Terug naar settings" />
        }
      >
        {isAdmin && (
          <>
            <EditButton
              onClick={() => navigate(`/settings/${id}/edit?${searchParams.toString()}`)}
              size="normal"
              ariaLabel="Instelling bewerken"
              showText
            />
            <DeleteButton onClick={handleDelete} size="normal" ariaLabel="Instelling verwijderen" showText />
          </>
        )}
      </PageHeader>

      <div className="space-y-6">
        <DetailCard title="Instellingen">
          <DetailBlock>
            <Row>
              <Label>App naam</Label>
              <Value>{setting.app_name}</Value>
            </Row>
            <Row>
              <Label>Icon 192px</Label>
              <Value>
                {icon192Url ? (
                  <img src={icon192Url} alt="Icon 192px" className="max-h-24 rounded object-contain" />
                ) : (
                  "-"
                )}
              </Value>
            </Row>
            <Row>
              <Label>Icon 512px</Label>
              <Value>
                {icon512Url ? (
                  <img src={icon512Url} alt="Icon 512px" className="max-h-24 rounded object-contain" />
                ) : (
                  "-"
                )}
              </Value>
            </Row>
          </DetailBlock>
        </DetailCard>
      </div>
    </PageContent>
  );
};

export default SettingDetail;

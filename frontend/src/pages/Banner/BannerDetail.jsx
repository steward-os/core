import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BackButton } from "../../components/Button/BackButton";
import { EditButton } from "../../components/Button/EditButton";
import { DeleteButton } from "../../components/Button/DeleteButton";
import PageContent from "../../components/Page/PageContent";
import PageHeader from "../../components/Page/PageHeader";
import CenteredAlert from "../../components/CenteredAlert";
import CenteredSpinner from "../../components/CenteredSpinner";
import DetailCard from "../../components/Detail/DetailCard";
import DetailBlock, { Row, Label, Value } from "../../components/Detail/DetailBlock";
import { getBanner } from "../../services/bannerService";
import { useDeleteBanner } from "../../hooks/crudResourceHooks";

const BannerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const deleteBannerMutation = useDeleteBanner();
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanner = async () => {
      setLoading(true);
      try {
        const bannerData = await getBanner(id);
        setBanner(bannerData);
      } catch (error) {
        console.error("Error fetching banner:", error);
        setBanner(null);
      } finally {
        setLoading(false);
      }
    };
    fetchBanner();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Weet je zeker dat je dit bericht wilt verwijderen?")) return;
    try {
      await deleteBannerMutation.mutateAsync(id);
      navigate(`/banners?${searchParams.toString()}`);
    } catch (error) {
      console.error("Error deleting banner:", error);
      alert("Er is een fout opgetreden bij het verwijderen van het bericht.");
    }
  };

  if (loading) return <CenteredSpinner />;
  if (!banner) return <CenteredAlert text="Banner bericht niet gevonden." />;

  return (
    <PageContent fullWidth>
      <PageHeader
        title="Banner bericht"
        backButton={
          <BackButton
            onClick={() => navigate(`/banners?${searchParams.toString()}`)}
            ariaLabel="Terug naar banners"
          />
        }
      >
        <EditButton
          onClick={() => navigate(`/banners/${id}/edit?${searchParams.toString()}`)}
          showText
          size="normal"
          ariaLabel="Banner bewerken"
        />
        <DeleteButton onClick={handleDelete} showText size="normal" ariaLabel="Banner verwijderen" />
      </PageHeader>

      <div className="space-y-6">
        <DetailCard title="Bericht">
          <div
            className="prose dark:prose-invert max-w-none text-[var(--text-primary)]"
            dangerouslySetInnerHTML={{ __html: banner.message }}
          />
          {banner.link && (
            <div className="mt-4 pt-4 border-t border-[var(--glass-border)]">
              <a
                href={banner.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {banner.link}
              </a>
            </div>
          )}
        </DetailCard>

        <DetailCard title="Details">
          <DetailBlock>
            <Row>
              <Label>Status</Label>
              <Value>
                <span
                  className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                    banner.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {banner.active ? "Actief" : "Inactief"}
                </span>
              </Value>
            </Row>
            <Row>
              <Label>Volgorde</Label>
              <Value>{banner.order ?? "-"}</Value>
            </Row>
            <Row>
              <Label>Aangemaakt</Label>
              <Value>{new Date(banner.created).toLocaleString("nl-NL")}</Value>
            </Row>
            <Row>
              <Label>Laatst bijgewerkt</Label>
              <Value>{new Date(banner.updated).toLocaleString("nl-NL")}</Value>
            </Row>
          </DetailBlock>
        </DetailCard>
      </div>
    </PageContent>
  );
};

export default BannerDetail;

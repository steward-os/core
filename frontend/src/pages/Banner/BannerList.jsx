import { useNavigate } from "react-router-dom";
import { AddButton } from "../../components/Button";
import CenteredAlert from "../../components/CenteredAlert";
import { ListContainer, ListHeading } from "../../components/List";
import { ListView } from "../../components/List/ListView";
import SmartSearch from "../../components/List/SmartSearch";
import { useSmartTagFilter } from "../../components/List/useSmartTagFilter";
import { useBanners, useDeleteBanner } from "../../hooks/crudResourceHooks";

const HEADER_COLUMNS = [
  {
    label: "Bericht",
    width: "55%",
    field: "message",
    sortable: false,
    render: (banner) => (
      <span dangerouslySetInnerHTML={{ __html: banner.message }} />
    ),
    mobilePosition: "title",
  },
  {
    label: "Status",
    width: "20%",
    sortable: false,
    render: (banner) => (
      <span
        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          banner.active
            ? "bg-green-100 text-green-800"
            : "bg-gray-100 text-gray-600"
        }`}
      >
        {banner.active ? "Actief" : "Inactief"}
      </span>
    ),
    mobilePosition: "right",
  },
];

const BannerList = () => {
  const navigate = useNavigate();
  const { tagConditions } = useSmartTagFilter();
  const filterOptions = tagConditions.length > 0 ? { filter: tagConditions.join(" && ") } : {};
  const { data: banners, isLoading, error } = useBanners(filterOptions);
  const deleteBannerMutation = useDeleteBanner();

  const handleDelete = async (id) => {
    if (!window.confirm("Weet je zeker dat je dit bericht wilt verwijderen?")) {
      return false;
    }
    try {
      await deleteBannerMutation.mutateAsync(id);
      return true;
    } catch (error) {
      console.error("Error deleting banner:", error);
      return false;
    }
  };

  return (
    <ListContainer fullWidth>
      <ListHeading
        button={
          <AddButton
            onClick={() => navigate("/banners/new")}
            ariaLabel="Nieuw bericht"
          />
        }
      >
        Banner Berichten
      </ListHeading>
      <SmartSearch searchFields={["message"]} placeholder="Zoek op bericht..." />

      {isLoading && <CenteredAlert text="Laden..." />}
      {error && <CenteredAlert text={`Fout bij laden: ${error.message}`} />}
      {!isLoading && !error && (
        <ListView
          data={banners || []}
          totalItems={banners?.length || 0}
          headerColumns={HEADER_COLUMNS}
          emptyMessage="Geen berichten gevonden."
          onClick={(banner) => navigate(`/banners/${banner.id}`)}
          onEdit={(banner) => navigate(`/banners/${banner.id}/edit`)}
          onDelete={handleDelete}
        />
      )}
    </ListContainer>
  );
};

export default BannerList;

import { useNavigate } from "react-router-dom";
import { AddButton } from "../../components/Button";
import CenteredAlert from "../../components/CenteredAlert";
import { ListContainer, ListHeading } from "../../components/List";
import { ListView } from "../../components/List/ListView";
import { useCreateMailing, useDeleteMailingWithConfirm, useMailings } from "../../hooks/crudResourceHooks";
import { formatDateTime } from "../../utils/dateTimeUtils";

const STATUS_LABELS = { draft: "Concept", sent: "Verzonden" };

const HEADER_COLUMNS = [
  {
    label: "Onderwerp",
    field: "subject",
    sortable: true,
    mobilePosition: "title",
  },
  {
    label: "Aan",
    width: "20%",
    field: "to",
    sortable: false,
    mobilePosition: "info",
  },
  {
    label: "Status",
    width: "12%",
    field: "status",
    sortable: true,
    mobilePosition: "info",
    render: (m) => (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${m.status === "sent" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
        {STATUS_LABELS[m.status] ?? m.status}
      </span>
    ),
  },
  {
    label: "Bijgewerkt",
    width: "16%",
    field: "updated",
    sortable: true,
    mobilePosition: "info",
    render: (m) => formatDateTime(m.updated),
  },
];

const MailingList = () => {
  const navigate = useNavigate();
  const { data, isLoading, error } = useMailings(1, 200, { sort: "-updated" });
  const { mutateAsync: createMailing } = useCreateMailing();
  const handleDelete = useDeleteMailingWithConfirm();

  const handleCreate = async () => {
    const mailing = await createMailing({ subject: "", to: "", html: "", status: "draft" });
    navigate(`/mailings/${mailing.id}/edit`);
  };

  return (
    <ListContainer>
      <ListHeading button={<AddButton onClick={handleCreate} ariaLabel="Nieuwe mailing" />}>
        Mailings
      </ListHeading>

      {isLoading && <CenteredAlert text="Laden..." />}
      {error && <CenteredAlert text={`Fout bij laden: ${error.message}`} />}
      {!isLoading && !error && (
        <ListView
          data={data?.items || []}
          totalItems={data?.totalItems || 0}
          headerColumns={HEADER_COLUMNS}
          defaultSortField="updated"
          defaultSortDirection="desc"
          emptyMessage="Geen mailings gevonden."
          onClick={(m) => navigate(`/mailings/${m.id}/edit`)}
          onDelete={handleDelete}
        />
      )}
    </ListContainer>
  );
};

export default MailingList;

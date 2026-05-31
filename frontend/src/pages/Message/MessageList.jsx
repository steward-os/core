import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AddButton } from "../../components/Button";
import CenteredAlert from "../../components/CenteredAlert";
import { ListContainer, ListHeading } from "../../components/List";
import { ListView } from "../../components/List/ListView";
import { buildColumnFilterConditions } from "../../hooks/utils/useColumnFilters";
import pb from "../../pb";
import { deleteMessage, getMessages } from "../../services/messageService";

const HEADER_COLUMNS = [
  {
    label: "Datum",
    width: "15%",
    field: "created",
    sortable: true,
    render: (item) => dayjs(item.created).format("DD-MM-YYYY HH:mm"),
    mobilePosition: "info",
  },
  {
    label: "Titel",
    width: "55%",
    field: "title",
    sortable: true,
    filter: "title",
    render: (item) => item.title,
    mobilePosition: "title",
  },
  {
    label: "Groepen",
    width: "30%",
    field: "groups",
    sortable: false,
    filter: (value) => `groups.name ?~ "${value}"`,
    render: (item) => {
      const groups = item.expand?.groups;
      if (groups && Array.isArray(groups) && groups.length > 0) {
        const groupNames = groups.map((g) => g.name).join(", ");
        return <span className="text">{groupNames}</span>;
      }
      return <span className="text text-gray-500">Alle gebruikers</span>;
    },
    mobilePosition: "info",
  },
];

const MessageList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState({ sortField: "created", sortDirection: "desc", filters: {} });
  const canSendMessages = !!pb.authStore.record?.can_send_messages || !!pb.authStore.record?.leden_app_admin;
  const isFetchingRef = useRef(false);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    if (isFetchingRef.current) {
      console.log("Already fetching, skipping...");
      return;
    }

    isFetchingRef.current = true;
    setLoading(true);

    const fetchMessages = async () => {
      try {
        const filterConditions = buildColumnFilterConditions(query.filters, HEADER_COLUMNS);

        const userId = pb.authStore.record?.id;
        filterConditions.push(`(groups.mb_group_members_via_group.user ?= "${userId}" || groups:length = 0)`);

        const queryOptions = {
          expand: "groups",
          sort: query.sortDirection === "desc" ? `-${query.sortField}` : query.sortField,
          ...(filterConditions.length > 0 && {
            filter: filterConditions.join(" && "),
          }),
        };
        const result = await getMessages(queryOptions);
        setMessages(result);
      } catch (error) {
        console.error("Error fetching messages:", error);
        console.error("Error details:", error.response?.data || error.message);
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    };

    fetchMessages();
  }, [query, refetchTrigger]);

  const handleDelete = async (id) => {
    if (!window.confirm("Weet je zeker dat je dit bericht wilt verwijderen?")) {
      return false;
    }

    try {
      await deleteMessage(id);
      setRefetchTrigger((prev) => prev + 1);
      return true;
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Er is een fout opgetreden bij het verwijderen van het bericht.");
      return false;
    }
  };

  return (
    <ListContainer fullWidth>
      <ListHeading
        button={
          canSendMessages ? (
            <AddButton onClick={() => navigate(`/messages/new?${searchParams.toString()}`)} ariaLabel="Nieuw bericht" />
          ) : null
        }
      >
        Berichten
      </ListHeading>

      {loading && messages.length === 0 && <CenteredAlert text="Laden..." />}
      {(!loading || messages.length > 0) && (
        <ListView
          data={messages}
          totalItems={messages.length}
          headerColumns={HEADER_COLUMNS}
          defaultSortField="created"
          defaultSortDirection="desc"
          emptyMessage="Geen berichten gevonden."
          onClick={(item) => navigate(`/messages/${item.id}?${searchParams.toString()}`)}
          {...(canSendMessages && {
            onEdit: (item) => navigate(`/messages/${item.id}/edit?${searchParams.toString()}`),
            onDelete: handleDelete,
          })}
          onQueryChange={setQuery}
        />
      )}
    </ListContainer>
  );
};

export default MessageList;

import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AddButton } from "../../components/Button";
import CenteredAlert from "../../components/CenteredAlert";
import CenteredSpinner from "../../components/CenteredSpinner";
import { ListContainer } from "../../components/List";
import SearchableHeader from "../../components/Page/SearchableHeader";
import { useReadMessageIds } from "../../hooks/useMessageReadQuery";
import pb from "../../pb";
import { getMessages } from "../../services/messageService";
import { formatRelativeDate, isVideoFile, recipientsLabel } from "../../utils/messageUtils";

/** One message as in a mail app: the groups' initial, the title (bold while unread) with the time, and a line of text. */
const MessageRow = ({ message, unread, onClick }) => {
  const recipients = recipientsLabel(message);
  const photo = (message.files || []).find((file) => !isVideoFile(file));
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <span className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 flex items-center justify-center font-medium">
          {recipients.charAt(0).toUpperCase()}
        </span>
        <span className="flex-1 min-w-0">
          <span className="flex items-baseline gap-2">
            <span className={`flex-1 truncate text-[var(--text-primary)] ${unread ? "font-bold" : ""}`}>{message.title}</span>
            <span className={`flex-shrink-0 text-xs ${unread ? "font-bold text-blue-600 dark:text-blue-400" : "text-[var(--text-secondary)]"}`}>
              {formatRelativeDate(message.created)}
            </span>
          </span>
          <span className="flex items-center gap-2">
            <span className={`flex-1 truncate text-sm ${unread ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
              {message.body}
            </span>
            {unread && <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400" aria-label="Nieuw" />}
          </span>
        </span>
        {photo && (
          <img
            src={pb.files.getURL(message, photo, { thumb: "100x100" })}
            alt=""
            loading="lazy"
            className="flex-shrink-0 w-12 h-12 rounded-lg object-cover bg-black/5"
          />
        )}
      </button>
    </li>
  );
};

const MessageList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const userId = pb.authStore.record?.id;
  const canSendMessages = !!pb.authStore.record?.can_send_messages || !!pb.authStore.record?.leden_app_admin;

  const { data: messages = [], isLoading, isError } = useQuery({
    queryKey: ["messages", userId],
    queryFn: () =>
      getMessages({
        expand: "groups",
        sort: "-created",
        // Messages to one of the user's groups, or (old ones) to everybody.
        filter: pb.filter("(groups.mb_group_members_via_group.user ?= {:userId} || groups:length = 0)", { userId }),
      }),
    enabled: !!userId,
  });
  const { data: readIds } = useReadMessageIds(userId);

  // Kept in the URL, so the search is still there when coming back from a message.
  const setQuery = (value) => setSearchParams(value ? { q: value } : {}, { replace: true });

  const needle = query.trim().toLowerCase();
  const visible = needle
    ? messages.filter((m) => m.title.toLowerCase().includes(needle) || recipientsLabel(m).toLowerCase().includes(needle))
    : messages;

  return (
    <ListContainer>
      <SearchableHeader
        title="Berichten"
        query={query}
        onQueryChange={setQuery}
        placeholder="Zoeken in berichten"
        actions={canSendMessages ? <AddButton onClick={() => navigate("/messages/new")} ariaLabel="Nieuw bericht" /> : null}
      />

      {isLoading && <CenteredSpinner />}
      {isError && <CenteredAlert text="De berichten konden niet worden geladen." />}
      {!isLoading && !isError && visible.length === 0 && <CenteredAlert text="Geen berichten gevonden." />}
      {visible.length > 0 && (
        <ul className="glass-panel rounded-2xl overflow-hidden divide-y divide-black/10 dark:divide-white/10">
          {visible.map((message) => (
            <MessageRow
              key={message.id}
              message={message}
              // Until the reads are loaded, nothing counts as new.
              unread={!!readIds && !readIds.has(message.id)}
              onClick={() => navigate(`/messages/${message.id}${query ? `?q=${encodeURIComponent(query)}` : ""}`)}
            />
          ))}
        </ul>
      )}
    </ListContainer>
  );
};

export default MessageList;

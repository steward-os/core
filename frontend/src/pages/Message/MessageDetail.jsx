import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowTopRightOnSquareIcon, CheckIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BackButton } from "../../components/Button/BackButton";
import { DeleteButton } from "../../components/Button/DeleteButton";
import { EditButton } from "../../components/Button/EditButton";
import CenteredAlert from "../../components/CenteredAlert";
import CenteredSpinner from "../../components/CenteredSpinner";
import DialogPanel from "../../components/Modal/DialogPanel";
import PageContent from "../../components/Page/PageContent";
import PageHeader from "../../components/Page/PageHeader";
import { useMarkMessageRead, useReadMessageIds } from "../../hooks/useMessageReadQuery";
import { useMessageReactions, useToggleMessageReaction, useUserMessageReactions } from "../../hooks/useMessageReactionQuery";
import pb from "../../pb";
import { deleteMessage, getMessage } from "../../services/messageService";
import { isVideoFile, recipientsLabel } from "../../utils/messageUtils";
import PhotoViewer from "./PhotoViewer";

const longDate = new Intl.DateTimeFormat("nl-NL", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** One photo at full width; several side by side to scroll through. A photo opens full screen, a video plays in place. */
const Attachments = ({ message, onPhotoClick }) => {
  const files = message.files || [];
  const photos = files.filter((file) => !isVideoFile(file));
  const single = files.length === 1;
  return (
    <div className={single ? "" : "flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 snap-x"}>
      {files.map((filename) => {
        const url = pb.files.getURL(message, filename);
        const size = single ? "w-full" : "flex-shrink-0 w-60 h-44 snap-start";
        if (isVideoFile(filename)) {
          return <video key={filename} src={url} controls playsInline preload="metadata" className={`${size} rounded-xl bg-black`} />;
        }
        return (
          <button key={filename} type="button" onClick={() => onPhotoClick(photos.indexOf(filename))} className={`${size} block`} aria-label="Foto openen">
            <img src={url} alt="" loading="lazy" className={`w-full ${single ? "" : "h-full object-cover"} rounded-xl bg-black/5`} />
          </button>
        );
      })}
    </div>
  );
};

/** The reaction buttons below each other, the chosen one filled in with a check. */
const ReactionButtons = ({ options, chosen, disabled, onClick }) => (
  <div className="flex flex-col gap-2">
    {options.map((option) => {
      const isChosen = chosen.includes(option);
      return (
        <button
          key={option}
          type="button"
          disabled={disabled}
          onClick={() => onClick(option)}
          className={`w-full min-h-12 px-4 py-2.5 rounded-full text-sm font-medium flex items-center justify-center gap-2 transition-colors border disabled:opacity-60 ${
            isChosen
              ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
              : "bg-[var(--glass-bg)] border-[var(--text-secondary)]/40 text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10"
          }`}
        >
          {isChosen && <CheckIcon className="w-4 h-4" />}
          {option}
        </button>
      );
    })}
  </div>
);

/** Per reaction button: how many chose it and who. */
const ReactionOverview = ({ options, reactions }) => (
  <div className="flex flex-col divide-y divide-black/10 dark:divide-white/10">
    {options.map((option) => {
      const forOption = reactions.filter((r) => r.reaction === option);
      return (
        <div key={option} className="py-3">
          <div className="font-medium text-[var(--text-primary)]">
            {option} ({forOption.length})
          </div>
          <div className="text-sm text-[var(--text-secondary)] mt-0.5">
            {forOption.length > 0 ? forOption.map((r) => r.expand?.user?.name || "Onbekend").join(", ") : "Nog niemand"}
          </div>
        </div>
      );
    })}
  </div>
);

const MessageDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [viewerPhoto, setViewerPhoto] = useState(null);
  const [showOverview, setShowOverview] = useState(false);

  const userId = pb.authStore.record?.id;
  const isAdmin = !!pb.authStore.record?.leden_app_admin;
  const canSendMessages = !!pb.authStore.record?.can_send_messages || isAdmin;

  const { data: message, isLoading } = useQuery({
    queryKey: ["message", id],
    queryFn: () => getMessage(id, { expand: "groups" }),
    retry: false,
  });
  const { data: userReactions } = useUserMessageReactions(id, userId);
  const { data: allReactions = [] } = useMessageReactions(isAdmin ? id : null);
  const toggleReaction = useToggleMessageReaction();
  const { data: readIds } = useReadMessageIds(userId);
  const markRead = useMarkMessageRead(userId);
  const isRead = !!readIds?.has(id);

  useEffect(() => {
    // Once the reads are known, and only when it is new to the user.
    if (message && readIds && !isRead) markRead.mutate(message.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message?.id, !!readIds, isRead]);

  const backToList = () => navigate(`/messages?${searchParams.toString()}`);

  const handleDelete = async () => {
    if (!window.confirm("Weet je zeker dat je dit bericht wilt verwijderen?")) return;
    try {
      await deleteMessage(id);
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      backToList();
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Er is een fout opgetreden bij het verwijderen van het bericht.");
    }
  };

  if (isLoading) return <CenteredSpinner />;
  if (!message) return <CenteredAlert text="Bericht niet gevonden." />;

  const reactionOptions = message.reaction_options || [];
  const chosen = (userReactions || []).map((r) => r.reaction);
  const photos = (message.files || []).filter((file) => !isVideoFile(file)).map((file) => ({ url: pb.files.getURL(message, file) }));

  const onReaction = (reaction) => {
    const own = userReactions || [];
    const existing = own.find((r) => r.reaction === reaction);
    // With only one choice allowed, a new choice replaces the old one.
    const replacing = !message.allow_multiple_reactions && !existing ? own.find((r) => r.reaction !== reaction) : null;
    toggleReaction.mutate({ messageId: id, userId, reaction, existingReactionId: existing?.id, replaceReactionId: replacing?.id });
  };

  return (
    <PageContent>
      <PageHeader title={message.title} backButton={<BackButton onClick={backToList} ariaLabel="Terug naar berichten" />}>
        {canSendMessages && (
          <>
            <EditButton onClick={() => navigate(`/messages/${id}/edit`)} showText size="normal" ariaLabel="Bericht bewerken" />
            <DeleteButton onClick={handleDelete} showText size="normal" ariaLabel="Bericht verwijderen" />
          </>
        )}
      </PageHeader>

      <article className="glass-panel rounded-2xl p-4 md:p-6 flex flex-col gap-4">
        <div>
          <div className="font-medium text-[var(--text-primary)]">{recipientsLabel(message)}</div>
          <div className="text-sm text-[var(--text-secondary)] first-letter:uppercase">{longDate.format(new Date(message.created))}</div>
        </div>
        <p className="text-[var(--text-primary)] whitespace-pre-wrap">{message.body}</p>
        {message.url && /^https?:\/\//.test(message.url) && !message.url.endsWith(`/messages/${message.id}`) && (
          <a
            href={message.url}
            target="_blank"
            rel="noopener noreferrer"
            className="self-start inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--text-secondary)]/40 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-black/5 dark:hover:bg-white/10"
          >
            Meer info
            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
          </a>
        )}
        {(message.files || []).length > 0 && <Attachments message={message} onPhotoClick={setViewerPhoto} />}
      </article>

      {reactionOptions.length > 0 && (
        // In reach at the bottom of the screen on a phone, above the navigation.
        <div className="sticky bottom-20 md:bottom-4 mt-4 glass-panel rounded-2xl p-3 flex flex-col gap-2">
          <ReactionButtons options={reactionOptions} chosen={chosen} disabled={!userReactions || toggleReaction.isPending} onClick={onReaction} />
          {isAdmin && (
            <button type="button" onClick={() => setShowOverview(true)} className="self-start px-2 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
              {allReactions.length} {allReactions.length === 1 ? "reactie" : "reacties"} bekijken
            </button>
          )}
        </div>
      )}

      <DialogPanel open={showOverview} onClose={() => setShowOverview(false)} title="Reactie overzicht">
        <ReactionOverview options={reactionOptions} reactions={allReactions} />
      </DialogPanel>
      {viewerPhoto !== null && photos.length > 0 && <PhotoViewer photos={photos} start={viewerPhoto} onClose={() => setViewerPhoto(null)} />}
    </PageContent>
  );
};

export default MessageDetail;

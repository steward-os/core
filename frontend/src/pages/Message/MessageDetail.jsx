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
import { getMessage, deleteMessage } from "../../services/messageService";
import { useMessageReactions, useUserMessageReactions, useToggleMessageReaction } from "../../hooks/useMessageReactionQuery";
import pb from "../../pb";

const MessageDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  const userId = pb.authStore.record?.id;
  const isAdmin = !!pb.authStore.record?.leden_app_admin;
  const canSendMessages = !!pb.authStore.record?.can_send_messages;

  const { data: userReactions = [] } = useUserMessageReactions(id, userId);
  const { data: allReactions = [] } = useMessageReactions(isAdmin ? id : null);
  const toggleReactionMutation = useToggleMessageReaction();

  useEffect(() => {
    const fetchMessage = async () => {
      setLoading(true);
      try {
        const messageData = await getMessage(id, { expand: "groups,standard_message_reactions" });
        setMessage(messageData);
      } catch (error) {
        console.error("Error fetching message:", error);
        setMessage(null);
      } finally {
        setLoading(false);
      }
    };
    fetchMessage();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Weet je zeker dat je dit bericht wilt verwijderen?")) return;
    try {
      await deleteMessage(id);
      navigate(`/messages?${searchParams.toString()}`);
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Er is een fout opgetreden bij het verwijderen van het bericht.");
    }
  };

  if (loading) return <CenteredSpinner />;
  if (!message) return <CenteredAlert text="Bericht niet gevonden." />;

  return (
    <PageContent fullWidth>
      <PageHeader
        title={message.title}
        backButton={
          <BackButton
            onClick={() => navigate(`/messages?${searchParams.toString()}`)}
            ariaLabel="Terug naar berichten"
          />
        }
      >
        {canSendMessages && (
          <>
            <EditButton
              onClick={() => navigate(`/messages/${id}/edit?${searchParams.toString()}`)}
              showText
              size="normal"
              ariaLabel="Bericht bewerken"
            />
            <DeleteButton onClick={handleDelete} showText size="normal" ariaLabel="Bericht verwijderen" />
          </>
        )}
      </PageHeader>

      <div className="space-y-6">
        <DetailCard title="Bericht" contentClassName="p-4 flex flex-col gap-4">
          {/* Recipients & date */}
          <div className="text-sm text-[var(--text-secondary)]">
            <span>
              {message.expand?.groups?.length > 0
                ? message.expand.groups.map((o) => o.name).join(", ")
                : "Alle gebruikers"}
            </span>
            <span className="mx-1">&middot;</span>
            <span>{new Date(message.created).toLocaleString("nl-NL")}</span>
          </div>

          {/* Body */}
          <div className="mt-4">
            <p className="text-[var(--text-primary)] whitespace-pre-wrap">{message.body}</p>
          </div>

          {/* Files */}
          {message.files?.length > 0 && (
            <div className="mt-4 space-y-3">
              {message.files.map((filename) => {
                const url = pb.files.getURL(message, filename);
                const isVideo = /\.(mp4|webm|mov|avi)$/i.test(filename);
                return isVideo ? (
                  <video key={filename} src={url} controls playsInline preload="metadata" className="w-full rounded-lg" />
                ) : (
                  <img key={filename} src={url} alt={filename} className="w-full rounded-lg" />
                );
              })}
            </div>
          )}

          {/* Link */}
          {message.url && !message.url.endsWith(`/messages/${message.id}`) && (
            <div className="mt-4">
              <a href={message.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-400 underline text-sm">
                Meer info
              </a>
            </div>
          )}

          {/* Reaction Buttons */}
          {message.expand?.standard_message_reactions?.length > 0 && (
            <div className="mt-6 pt-6 border-t border-[var(--glass-border)]">
              <h3 className="text-base font-medium text-[var(--text-primary)] mb-3">Reacties</h3>
              <div className="flex flex-wrap gap-2">
                {message.expand.standard_message_reactions.map((reaction) => {
                  const existingReaction = userReactions.find((r) => r.standard_reaction === reaction.id);
                  const hasReacted = !!existingReaction;
                  return (
                    <button
                      key={reaction.id}
                      type="button"
                      disabled={toggleReactionMutation.isPending}
                      onClick={() => {
                        const otherReaction = !message.allow_multiple_reactions && !existingReaction
                          ? userReactions.find((r) => r.standard_reaction !== reaction.id)
                          : null;
                        toggleReactionMutation.mutate({
                          messageId: id,
                          userId,
                          standardReactionId: reaction.id,
                          existingReactionId: existingReaction?.id,
                          replaceReactionId: otherReaction?.id,
                        });
                      }}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                        hasReacted
                          ? "bg-blue-500/15 border-blue-500/30 text-blue-600 dark:text-blue-400"
                          : "bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10"
                      }`}
                    >
                      <span>{reaction.emoji}</span>
                      <span>{reaction.reaction}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Admin Reaction Summary */}
          {isAdmin && message.expand?.standard_message_reactions?.length > 0 && allReactions.length > 0 && (
            <div className="mt-6 pt-6 border-t border-[var(--glass-border)]">
              <h3 className="text-base font-medium text-[var(--text-primary)] mb-3">Reactie overzicht</h3>
              <div className="space-y-3">
                {message.expand.standard_message_reactions.map((reaction) => {
                  const reactionsForThis = allReactions.filter((r) => r.standard_reaction === reaction.id);
                  if (reactionsForThis.length === 0) return null;
                  const userNames = reactionsForThis.map((r) => r.expand?.user?.name || "Onbekend").join(", ");
                  return (
                    <div key={reaction.id} className="flex items-start gap-3 p-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg">
                      <span className="text-lg">{reaction.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-[var(--text-primary)]">{reaction.reaction} ({reactionsForThis.length})</div>
                        <div className="text-sm text-[var(--text-secondary)] mt-0.5">{userNames}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DetailCard>
      </div>
    </PageContent>
  );
};

export default MessageDetail;

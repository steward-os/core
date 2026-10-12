import { useQueryClient } from "@tanstack/react-query";
import { ChartBarIcon, PaperAirplaneIcon, PhotoIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CloseButton } from "../../components/Button/CloseButton";
import CenteredAlert from "../../components/CenteredAlert";
import CenteredSpinner from "../../components/CenteredSpinner";
import SearchableSelect from "../../components/Form/SearchableSelect";
import TagSelector from "../../components/Form/TagSelector";
import PageContent from "../../components/Page/PageContent";
import PageHeader from "../../components/Page/PageHeader";
import pb from "../../pb";
import { markMessageRead } from "../../services/messageReadService";
import { useGroupMembers } from "../../hooks/useMessageTargetQuery";
import { createMessage, getMessage, updateMessage } from "../../services/messageService";
import { cleanReactionOptions, countRecipients, isVideoFile, reactionRowsFrom, sectionOptions } from "../../utils/messageUtils";
import ReactionEditor from "./ReactionEditor";
import SendConfirmModal from "./SendConfirmModal";

const TITLE_MAX = 200;
const BODY_MAX = 1000;

/** The count only shows once it matters. */
const Counter = ({ length, max }) =>
  length >= max * 0.8 ? <div className="px-4 pb-1 text-right text-xs text-[var(--text-secondary)]">{length} / {max}</div> : null;

/** A photo or video with a button to remove it. */
const Thumbnail = ({ src, isVideo, onRemove, disabled }) => (
  <div className="relative flex-shrink-0 w-24 h-24">
    {isVideo ? (
      <video src={src} muted className="w-full h-full rounded-lg object-cover bg-black" />
    ) : (
      <img src={src} alt="" className="w-full h-full rounded-lg object-cover bg-black/5" />
    )}
    <button
      type="button"
      onClick={onRemove}
      disabled={disabled}
      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center"
      aria-label="Bestand verwijderen"
    >
      <XMarkIcon className="w-4 h-4" />
    </button>
  </div>
);

/**
 * A compose page like a mail app's and the Android app: who it goes to, title and text without boxes
 * around them, photos below, and the reaction buttons where members will see them, under the message.
 * A bar at the bottom adds photos, asks for a reaction and sends.
 */
const MessageEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = !id;
  const userId = pb.authStore.record?.id;
  const fileInputRef = useRef(null);

  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [groupOptions, setGroupOptions] = useState([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [group, setGroup] = useState("");
  const [sections, setSections] = useState([]);
  const [reactions, setReactions] = useState(reactionRowsFrom([]));
  const [asksReaction, setAsksReaction] = useState(false);
  const [reactionFocus, setReactionFocus] = useState(0);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [newFiles, setNewFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [removedFiles, setRemovedFiles] = useState([]);
  const [confirmSend, setConfirmSend] = useState(false);

  // Wraps a setter so any change marks the form as changed.
  const edit = (setter) => (value) => {
    setter(value);
    setDirty(true);
    setError(null);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const allGroups = await pb.collection("mb_groups").getFullList({ sort: "name" });
        setGroupOptions(allGroups.map((g) => ({ id: g.id, name: g.name })));
        if (!isNew) {
          const data = await getMessage(id);
          setMessage(data);
          setTitle(data.title || "");
          setBody(data.body || "");
          setGroup(data.group || "");
          setSections(data.sections || []);
          setReactions(reactionRowsFrom(data.reaction_options || []));
          setAsksReaction((data.reaction_options || []).length > 0);
          setAllowMultiple(!!data.allow_multiple_reactions);
          setExistingFiles(data.files || []);
        }
      } catch (err) {
        console.error("Error fetching message:", err);
      }
      setLoading(false);
    };
    load();
  }, [id, isNew]);

  // Object URLs for the previews of picked files, released when they go.
  const [previews, setPreviews] = useState([]);
  useEffect(() => {
    const urls = newFiles.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [newFiles]);

  const close = () => {
    if (dirty && !window.confirm("Wijzigingen weggooien? Wat je hebt ingevuld, wordt niet bewaard.")) return;
    navigate(isNew ? "/messages" : `/messages/${id}`);
  };

  const askReaction = () => {
    setAsksReaction(true);
    setReactionFocus((n) => n + 1);
  };

  // The group's members decide which sections can be picked and how many people the message reaches.
  const { data: members = [] } = useGroupMembers(group);
  const sectionChoices = useMemo(() => sectionOptions(members), [members]);
  const recipientCount = countRecipients(members, sections);
  const selectedGroup = groupOptions.find((g) => g.id === group);
  const sectionName = (sectionId) => members.find((m) => m.section === sectionId)?.expand?.section?.name;

  /** Another group has other sections, so the chosen ones go. */
  const chooseGroup = (groupId) => {
    if (groupId === group) return;
    edit(setGroup)(groupId);
    setSections([]);
  };

  /** Checks the form; a new message is confirmed first, as it is pushed to the members at once. */
  const handleSend = () => {
    if (!group) return setError("Kies een groep.");
    if (!title.trim()) return setError("Vul een titel in.");
    if (!body.trim()) return setError("Vul een bericht in.");
    if (isNew) setConfirmSend(true);
    else save();
  };

  const save = async () => {
    setConfirmSend(false);
    setSaving(true);
    try {
      const options = cleanReactionOptions(reactions.rows);
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("body", body.trim());
      // Choosing more than one only means something with more than one button.
      fd.append("allow_multiple_reactions", allowMultiple && options.length > 1);
      fd.append("group", group);
      // An empty value clears the sections when editing; no sections means everyone in the group.
      if (sections.length === 0) fd.append("sections", "");
      sections.forEach((sectionId) => fd.append("sections", sectionId));
      fd.append("reaction_options", JSON.stringify(options));
      newFiles.forEach((file) => fd.append("files", file));
      if (!isNew) {
        // Tell PocketBase which existing files to keep (removes the rest).
        existingFiles.filter((f) => !removedFiles.includes(f)).forEach((f) => fd.append("files", f));
      }

      if (isNew) {
        fd.append("url", "/messages");
        const created = await createMessage(fd);
        // Your own message is not new to you.
        await markMessageRead(created.id, userId).catch(() => {});
        queryClient.invalidateQueries({ queryKey: ["messages"] });
        queryClient.invalidateQueries({ queryKey: ["message-reads"] });
        setDirty(false);
        navigate("/messages");
      } else {
        await updateMessage(id, fd);
        queryClient.invalidateQueries({ queryKey: ["messages"] });
        queryClient.invalidateQueries({ queryKey: ["message", id] });
        navigate(`/messages/${id}`);
      }
    } catch (err) {
      console.error("Error saving message:", err);
      setError("Er is een fout opgetreden bij het opslaan van het bericht.");
    }
    setSaving(false);
  };

  if (loading) return <CenteredSpinner />;
  if (!isNew && !message) return <CenteredAlert text="Bericht niet gevonden." />;

  const keptFiles = existingFiles.filter((f) => !removedFiles.includes(f));
  const plainField = "w-full px-4 py-3 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none";
  const toolbarButton = "inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50";

  return (
    <PageContent>
      <PageHeader title={isNew ? "Nieuw bericht" : "Bericht bewerken"} backButton={<CloseButton onClick={close} size="normal" ariaLabel="Annuleren" />} />

      <div className="glass-panel rounded-2xl overflow-hidden">
        {/* "Aan": the group, searched and picked in place. */}
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="text-[var(--text-secondary)]">Aan</span>
          <SearchableSelect
            options={groupOptions.map((g) => ({ value: g.id, label: g.name }))}
            value={group}
            onChange={chooseGroup}
            placeholder="Kies een groep"
            disabled={saving}
            className="flex-1 min-w-0"
          />
        </div>
        {/* Sections narrow the group down; only shown when the group's members have sections. */}
        {sectionChoices.length > 0 && (
          <>
            <div className="border-t border-black/10 dark:border-white/10" />
            <div className="flex items-start gap-3 px-4 py-3">
              <span className="pt-1.5 text-[var(--text-secondary)]">Secties</span>
              <TagSelector
                availableTags={sectionChoices}
                selectedTagIds={sections}
                onTagsChange={edit(setSections)}
                placeholder="Iedereen"
                className="flex-1 min-w-0"
              />
            </div>
          </>
        )}
        {group && (
          <div className="px-4 pb-2 text-xs text-[var(--text-secondary)]">
            {recipientCount === 1 ? "1 ontvanger" : `${recipientCount} ontvangers`}
          </div>
        )}
        <div className="border-t border-black/10 dark:border-white/10" />
        <input
          type="text"
          value={title}
          onChange={(e) => edit(setTitle)(e.target.value.slice(0, TITLE_MAX))}
          placeholder="Titel"
          disabled={saving}
          className={`${plainField} text-xl font-medium`}
          aria-label="Titel"
        />
        <Counter length={title.length} max={TITLE_MAX} />
        <div className="border-t border-black/10 dark:border-white/10" />
        <textarea
          value={body}
          onChange={(e) => edit(setBody)(e.target.value.slice(0, BODY_MAX))}
          placeholder="Schrijf je bericht"
          rows={6}
          disabled={saving}
          className={`${plainField} resize-y`}
          aria-label="Bericht"
        />
        <Counter length={body.length} max={BODY_MAX} />

        {(keptFiles.length > 0 || newFiles.length > 0) && (
          <div className="flex gap-2 overflow-x-auto px-4 py-2">
            {keptFiles.map((filename) => (
              <Thumbnail
                key={filename}
                src={pb.files.getURL(message, filename)}
                isVideo={isVideoFile(filename)}
                disabled={saving}
                onRemove={() => edit(setRemovedFiles)([...removedFiles, filename])}
              />
            ))}
            {newFiles.map((file, index) => (
              <Thumbnail
                key={`${file.name}-${index}`}
                src={previews[index]}
                isVideo={file.type.startsWith("video/")}
                disabled={saving}
                onRemove={() => edit(setNewFiles)(newFiles.filter((_, i) => i !== index))}
              />
            ))}
          </div>
        )}

        <div className="px-4 py-3">
          {asksReaction ? (
            <ReactionEditor
              value={reactions}
              onChange={edit(setReactions)}
              allowMultiple={allowMultiple}
              onAllowMultipleChange={edit(setAllowMultiple)}
              onClear={() => {
                edit(setReactions)(reactionRowsFrom([]));
                setAllowMultiple(false);
                setAsksReaction(false);
              }}
              disabled={saving}
              focusRequest={reactionFocus}
            />
          ) : (
            <button
              type="button"
              onClick={askReaction}
              disabled={saving}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--text-secondary)]/40 text-sm text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10"
            >
              <PlusIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Reactie vragen
            </button>
          )}
        </div>
      </div>

      {/* In reach at the bottom of the screen, above the navigation on a phone; a problem shows right above the send button. */}
      <div className="sticky bottom-20 md:bottom-4 mt-4 glass-panel rounded-2xl px-2 py-2">
        {error && (
          <p role="alert" className="mx-1 mb-2 px-3 py-2 rounded-xl bg-red-500/10 text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        )}
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={saving} className={toolbarButton} aria-label="Foto's of video's toevoegen">
            <PhotoIcon className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              edit(setNewFiles)([...newFiles, ...Array.from(e.target.files)]);
              e.target.value = "";
            }}
          />
          <button type="button" onClick={askReaction} disabled={saving} className={toolbarButton}>
            <ChartBarIcon className="w-5 h-5" />
            Reactie vragen
          </button>
          <span className="flex-1" />
          <button
            type="button"
            onClick={handleSend}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Bezig…" : isNew ? "Verzenden" : "Opslaan"}
            {isNew && !saving && <PaperAirplaneIcon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <SendConfirmModal
        isOpen={confirmSend}
        onClose={() => setConfirmSend(false)}
        onConfirm={save}
        groupName={selectedGroup?.name || ""}
        sectionNames={sections.map(sectionName).filter(Boolean)}
        recipientCount={recipientCount}
        title={title.trim()}
        body={body.trim()}
      />
    </PageContent>
  );
};

export default MessageEdit;

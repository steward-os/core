import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../../components/Button/Button";
import { CloseButton } from "../../components/Button/CloseButton";
import CenteredAlert from "../../components/CenteredAlert";
import CenteredSpinner from "../../components/CenteredSpinner";
import DetailBlock, { Label, Row } from "../../components/Detail/DetailBlock";
import DetailCard from "../../components/Detail/DetailCard";
import Checkbox from "../../components/Form/Checkbox";
import Input from "../../components/Form/Input";
import TagSelector from "../../components/Form/TagSelector";
import Textarea from "../../components/Form/Textarea";
import PageContent from "../../components/Page/PageContent";
import PageHeader from "../../components/Page/PageHeader";
import pb from "../../pb";
import { createMessage, getMessage, updateMessage } from "../../services/messageService";
import { createStandardReaction, getStandardReactions } from "../../services/standardReactionService";
import MessageDeliveryModal from "./MessageDeliveryModal";

const EMOJI_OPTIONS = [
  "👍",
  "👎",
  "❤️",
  "🎵",
  "🎶",
  "🎺",
  "🥁",
  "🎷",
  "✅",
  "❌",
  "🙋",
  "👋",
  "🎉",
  "🔥",
  "⭐",
  "💪",
  "😊",
  "😢",
  "😮",
  "🤔",
  "😍",
  "👏",
  "🙏",
  "💬",
];

const EmojiPicker = ({ onSelect, onClose, reactionText }) => {
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25">
      <div ref={pickerRef} className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-xs w-full">
        <p className="text-sm font-medium text-gray-700 mb-3">Kies een emoji voor &ldquo;{reactionText}&rdquo;</p>
        <div className="grid grid-cols-8 gap-1">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onSelect(emoji)}
              className="w-9 h-9 flex items-center justify-center text-xl rounded hover:bg-blue-100 transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full text-sm text-gray-500 hover:text-gray-700 text-center"
        >
          Annuleren
        </button>
      </div>
    </div>
  );
};

const MessageEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreateMode = !id;
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [groupOptions, setGroupOptions] = useState([]);
  const [reactionOptions, setReactionOptions] = useState([]);
  const [pendingReactionText, setPendingReactionText] = useState(null);
  const [newFiles, setNewFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [removedFiles, setRemovedFiles] = useState([]);
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    groups: [],
    standard_message_reactions: [],
    allow_multiple_reactions: false,
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Always fetch group options
        const groups = await pb.collection("mb_groups").getFullList({
          sort: "name",
        });
        setGroupOptions(groups.map((o) => ({ id: o.id, name: o.name })));

        // Fetch standard reactions
        const reactions = await getStandardReactions({ sort: "reaction" });
        setReactionOptions(reactions.map((r) => ({ id: r.id, name: `${r.emoji} ${r.reaction}` })));

        // Only fetch message data if editing existing message
        if (!isCreateMode) {
          const messageData = await getMessage(id);
          setMessage(messageData);
          setFormData({
            title: messageData.title || "",
            body: messageData.body || "",
            groups: messageData.groups || [],
            standard_message_reactions: messageData.standard_message_reactions || [],
            allow_multiple_reactions: messageData.allow_multiple_reactions || false,
          });
          setExistingFiles(messageData.files || []);
        }
      } catch (error) {
        console.error("Error fetching message:", error);
      }
      setLoading(false);
    };

    loadData();
  }, [id, isCreateMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert("Vul een titel in.");
      return;
    }

    if (!formData.body.trim()) {
      alert("Vul een bericht in.");
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", formData.title);
      fd.append("body", formData.body);
      fd.append("allow_multiple_reactions", formData.allow_multiple_reactions);
      formData.groups.forEach((g) => fd.append("groups", g));
      formData.standard_message_reactions.forEach((r) => fd.append("standard_message_reactions", r));
      newFiles.forEach((file) => fd.append("files", file));
      // Tell PocketBase which existing files to keep (removes the rest)
      if (!isCreateMode) {
        const keepFiles = existingFiles.filter((f) => !removedFiles.includes(f));
        keepFiles.forEach((f) => fd.append("files", f));
      }

      if (isCreateMode) {
        fd.append("url", "/messages");
        await createMessage(fd);
        const info = await fetchDeliveryInfo(formData.groups);
        setDeliveryInfo(info);
        setShowDeliveryModal(true);
      } else {
        await updateMessage(id, fd);
        // Add a small delay to ensure the update is processed
        await new Promise((resolve) => setTimeout(resolve, 100));
        navigate(`/messages/${id}`);
      }
    } catch (error) {
      console.error("Error saving message:", error);
      alert("Er is een fout opgetreden bij het opslaan van het bericht.");
    }
    setSaving(false);
  };

  const fetchDeliveryInfo = async (groups) => {
    try {
      if (groups.length > 0) {
        const groupFilter = groups.map((g) => `group="${g}"`).join(" || ");
        const members = await pb.collection("mb_group_members").getFullList({
          filter: `(${groupFilter})`,
        });
        const userIds = [...new Set(members.map((m) => m.user))];
        if (userIds.length === 0) return { subscribed: [], total: 0, hasGroups: true };
        const subFilter = userIds.map((uid) => `user="${uid}"`).join(" || ");
        const subs = await pb.collection("push_subscriptions").getFullList({
          filter: `(${subFilter})`,
          expand: "user",
        });
        const seen = new Set();
        const subscribedUsers = [];
        for (const sub of subs) {
          if (!seen.has(sub.user) && sub.expand?.user) {
            seen.add(sub.user);
            subscribedUsers.push(sub.expand.user);
          }
        }
        return { subscribed: subscribedUsers, total: userIds.length, hasGroups: true };
      } else {
        const subs = await pb.collection("push_subscriptions").getFullList({ expand: "user" });
        const seen = new Set();
        const subscribedUsers = [];
        for (const sub of subs) {
          if (!seen.has(sub.user) && sub.expand?.user) {
            seen.add(sub.user);
            subscribedUsers.push(sub.expand.user);
          }
        }
        return { subscribed: subscribedUsers, total: null, hasGroups: false };
      }
    } catch (err) {
      console.error("Error fetching delivery info:", err);
      return { subscribed: [], total: null, hasGroups: groups.length > 0 };
    }
  };

  const handleCreateReaction = (term) => {
    setPendingReactionText(term);
    return null; // don't add yet, emoji picker will handle it
  };

  const handleEmojiSelected = async (emoji) => {
    const text = pendingReactionText;
    setPendingReactionText(null);
    try {
      const result = await createStandardReaction({ emoji, reaction: text });
      const newOption = { id: result.id, name: `${emoji} ${result.reaction}` };
      setReactionOptions((prev) => [...prev, newOption]);
      setFormData((prev) => ({
        ...prev,
        standard_message_reactions: [...prev.standard_message_reactions, result.id],
      }));
    } catch (error) {
      console.error("Error creating reaction:", error);
      alert("Er is een fout opgetreden bij het aanmaken van de reactie.");
    }
  };

  if (loading) {
    return <CenteredSpinner />;
  }

  if (!isCreateMode && !message && !loading) {
    return <CenteredAlert text="Bericht niet gevonden." />;
  }

  return (
    <PageContent fullWidth>
      <PageHeader title={isCreateMode ? "Nieuw bericht" : "Bericht bewerken"} variant="edit">
        <CloseButton
          onClick={() => navigate(isCreateMode ? "/messages" : `/messages/${id}`)}
          size="normal"
          ariaLabel="Annuleren"
        />
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        <DetailCard title="Berichtgegevens">
          <DetailBlock>
            <Row>
              <Label htmlFor="title" required>
                Titel
              </Label>
              <div>
                <Input
                  id="title"
                  name="title"
                  placeholder="Voer de titel in"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  maxLength={200}
                />
                <p className="mt-1 text-xs text-gray-500">Maximaal 200 karakters</p>
              </div>
            </Row>

            <Row>
              <Label htmlFor="body" required>
                Bericht
              </Label>
              <div>
                <Textarea
                  id="body"
                  name="body"
                  placeholder="Voer het bericht in"
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  rows={4}
                  maxLength={1000}
                />
                <p className="mt-1 text-xs text-gray-500">Maximaal 1000 karakters</p>
              </div>
            </Row>
          </DetailBlock>
        </DetailCard>

        <DetailCard title="Ontvangers & Interactie">
          <DetailBlock>
            <Row>
              <Label htmlFor="groups">Groepen (optioneel)</Label>
              <div>
                <TagSelector
                  availableTags={groupOptions}
                  selectedTagIds={formData.groups}
                  onTagsChange={(ids) => setFormData({ ...formData, groups: ids })}
                  placeholder="Type om groepen te zoeken..."
                />
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  Laat leeg om naar alle gebruikers te verzenden.
                </p>
              </div>
            </Row>

            <Row>
              <Label htmlFor="standard_message_reactions">Reactieknoppen (optioneel)</Label>
              <TagSelector
                availableTags={reactionOptions}
                selectedTagIds={formData.standard_message_reactions}
                onTagsChange={(ids) => setFormData({ ...formData, standard_message_reactions: ids })}
                onCreateNew={handleCreateReaction}
                placeholder="Type om reacties te zoeken..."
                createNewLabel="Aanmaken"
              />
            </Row>

            <Row>
              <Label htmlFor="allow_multiple_reactions">Reactie-instellingen</Label>
              <div className="pt-1">
                <Checkbox
                  id="allow_multiple_reactions"
                  checked={formData.allow_multiple_reactions}
                  onChange={(e) => setFormData({ ...formData, allow_multiple_reactions: e.target.checked })}
                  label="Meerdere reacties toestaan"
                />
              </div>
            </Row>
          </DetailBlock>
        </DetailCard>

        <DetailCard title="Bestanden">
          <DetailBlock>
            <Row>
              <Label>Foto's of video's</Label>
              <div>
                <label className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  Bestanden toevoegen
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      setNewFiles((prev) => [...prev, ...files]);
                      e.target.value = "";
                    }}
                    className="sr-only"
                  />
                </label>

                {/* Existing files (edit mode) */}
                {existingFiles.filter((f) => !removedFiles.includes(f)).length > 0 && (
                  <div className="mt-3 space-y-2">
                    {existingFiles
                      .filter((f) => !removedFiles.includes(f))
                      .map((filename) => {
                        const url = pb.files.getURL(message, filename);
                        const isVideo = /\.(mp4|webm|mov|avi)$/i.test(filename);
                        return (
                          <div key={filename} className="relative inline-block mr-2">
                            {isVideo ? (
                              <video src={url} className="h-24 rounded-lg object-cover" muted />
                            ) : (
                              <img src={url} alt={filename} className="h-24 rounded-lg object-cover" />
                            )}
                            <button
                              type="button"
                              onClick={() => setRemovedFiles((prev) => [...prev, filename])}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                            >
                              &times;
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* New file previews */}
                {newFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {newFiles.map((file, index) => {
                      const isVideo = file.type.startsWith("video/");
                      const previewUrl = URL.createObjectURL(file);
                      return (
                        <div key={index} className="relative inline-block mr-2">
                          {isVideo ? (
                            <video src={previewUrl} className="h-24 rounded-lg object-cover" muted />
                          ) : (
                            <img src={previewUrl} alt={file.name} className="h-24 rounded-lg object-cover" />
                          )}
                          <button
                            type="button"
                            onClick={() => setNewFiles((prev) => prev.filter((_, i) => i !== index))}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                          >
                            &times;
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Row>
          </DetailBlock>
        </DetailCard>

        <div className="flex flex-col md:flex-row gap-3 pt-4">
          <Button
            type="button"
            onClick={() => navigate(isCreateMode ? "/messages" : `/messages/${id}`)}
            color="gray"
            text="Annuleren"
            className="w-full md:w-auto md:min-w-[160px] justify-center"
          />
          <Button
            type="submit"
            disabled={saving}
            color="blue"
            text={saving ? "Verzenden..." : isCreateMode ? "Verzenden" : "Opslaan"}
            className="w-full md:w-auto md:min-w-[160px] justify-center"
          />
        </div>
      </form>

      {pendingReactionText && (
        <EmojiPicker
          reactionText={pendingReactionText}
          onSelect={handleEmojiSelected}
          onClose={() => setPendingReactionText(null)}
        />
      )}

      <MessageDeliveryModal
        isOpen={showDeliveryModal}
        onClose={() => {
          setShowDeliveryModal(false);
          navigate("/messages");
        }}
        deliveryInfo={deliveryInfo}
      />
    </PageContent>
  );
};

export default MessageEdit;

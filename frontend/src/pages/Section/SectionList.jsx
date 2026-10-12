import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { DeleteButton, EditButton } from "../../components/Button";
import { Button } from "../../components/Button/Button";
import CenteredAlert from "../../components/CenteredAlert";
import Input from "../../components/Form/Input";
import { ListContainer, ListHeading } from "../../components/List";
import { useCreateSection, useDeleteSectionWithConfirm, useSections, useUpdateSection } from "../../hooks/crudResourceHooks";

const iconButton = "p-1.5 rounded-md text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50";

/** One section: its name, or an input while it is being renamed (Enter saves, Escape cancels). */
const SectionRow = ({ section, editing, onEdit, onCancel, onSave, onDelete, saving }) => {
  const [name, setName] = useState(section.name);

  if (!editing) {
    return (
      <div className="flex items-center px-4 py-2">
        <div className="flex-1 text-[var(--text-primary)]">{section.name}</div>
        <div className="flex items-center gap-1">
          <EditButton onClick={onEdit} ariaLabel={`${section.name} hernoemen`} />
          <DeleteButton onClick={onDelete} ariaLabel={`${section.name} verwijderen`} />
        </div>
      </div>
    );
  }

  const save = () => (name.trim() && name.trim() !== section.name ? onSave(name.trim()) : onCancel());
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex-1">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") onCancel();
          }}
          disabled={saving}
          autoFocus
          aria-label="Naam"
        />
      </div>
      <button type="button" onClick={save} disabled={saving || !name.trim()} className={iconButton} aria-label="Opslaan">
        <CheckIcon className="w-4 h-4" />
      </button>
      <button type="button" onClick={onCancel} disabled={saving} className={iconButton} aria-label="Annuleren">
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

/** Sections are only a name, so they are added, renamed and deleted right in the list. */
const SectionList = () => {
  const { data, isLoading, error } = useSections(1, 500, { sort: "name" });
  const createSection = useCreateSection();
  const updateSection = useUpdateSection();
  const handleDelete = useDeleteSectionWithConfirm();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  const sections = (data?.items || []).filter((s) => s.name.toLowerCase().includes(search.trim().toLowerCase()));

  const add = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      await createSection.mutateAsync({ name });
      setNewName("");
    } catch (err) {
      console.error("Error creating section:", err);
      alert("Er is een fout opgetreden bij het toevoegen van de sectie.");
    }
  };

  const rename = async (id, name) => {
    try {
      await updateSection.mutateAsync({ id, data: { name } });
      setEditingId(null);
    } catch (err) {
      console.error("Error renaming section:", err);
      alert("Er is een fout opgetreden bij het opslaan van de sectie.");
    }
  };

  return (
    <ListContainer>
      <ListHeading>Secties</ListHeading>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="flex-1">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Nieuwe sectie, bijvoorbeeld Trompet"
            aria-label="Nieuwe sectie"
          />
        </div>
        <Button type="button" onClick={add} disabled={!newName.trim() || createSection.isPending} color="blue" text="Toevoegen" />
      </div>

      <div className="mb-2">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Zoeken..." aria-label="Zoeken" />
      </div>

      {isLoading && <CenteredAlert text="Laden..." />}
      {error && <CenteredAlert text={`Fout bij laden: ${error.message}`} />}
      {!isLoading && !error && (
        <div className="glass-panel rounded-2xl overflow-hidden divide-y divide-black/5 dark:divide-white/10">
          {sections.length === 0 && <div className="px-4 py-3 text-sm text-[var(--text-secondary)]">Geen secties gevonden.</div>}
          {sections.map((section) => (
            <SectionRow
              key={section.id}
              section={section}
              editing={editingId === section.id}
              onEdit={() => setEditingId(section.id)}
              onCancel={() => setEditingId(null)}
              onSave={(name) => rename(section.id, name)}
              onDelete={() => handleDelete(section.id)}
              saving={updateSection.isPending}
            />
          ))}
        </div>
      )}
    </ListContainer>
  );
};

export default SectionList;

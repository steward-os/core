import { useState, useEffect } from "react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button } from "./Button/Button";
import Label from "./Form/Label";
import Input from "./Form/Input";
import Textarea from "./Form/Textarea";
import DialogPanel from "./Modal/DialogPanel";
import { getNotesByRelation, createNoteForRelation, deleteRelationNote } from "../services/relationNotesService";

const RelationNotes = ({ relationId }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    note: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    const loadNotes = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getNotesByRelation(relationId);
        if (!isCancelled) {
          setNotes(data);
        }
      } catch (err) {
        if (!isCancelled && !err.isAbort) {
          setError(`Fout bij laden van notities: ${err.message}`);
          console.error("Error loading notes:", err);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadNotes();

    return () => {
      isCancelled = true;
    };
  }, [relationId]);

  const loadNotes = async () => {
    try {
      setError(null);
      const data = await getNotesByRelation(relationId);
      setNotes(data);
    } catch (err) {
      if (!err.isAbort) {
        setError(`Fout bij laden van notities: ${err.message}`);
        console.error("Error loading notes:", err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.note.trim()) {
      setError("Titel en notitie zijn verplicht");
      return;
    }

    try {
      setFormLoading(true);
      setError(null);

      await createNoteForRelation(relationId, formData.title, formData.note);

      setFormData({ title: "", note: "" });
      setShowModal(false);

      await loadNotes();
    } catch (err) {
      setError("Fout bij opslaan van notitie");
      console.error("Error creating note:", err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm("Weet je zeker dat je deze notitie wilt verwijderen?")) {
      return;
    }

    try {
      await deleteRelationNote(noteId);
      await loadNotes();
    } catch (err) {
      setError("Fout bij verwijderen van notitie");
      console.error("Error deleting note:", err);
    }
  };

  const closeModal = () => {
    setFormData({ title: "", note: "" });
    setShowModal(false);
    setError(null);
  };

  return (
    <div className="border-t dark:border-gray-700 pt-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Notities</h3>
        <Button
          onClick={() => setShowModal(true)}
          color="blue"
          size="small"
          text="Notitie toevoegen"
          className="flex items-center gap-2"
        >
          <PlusIcon className="h-4 w-4" />
          Notitie toevoegen
        </Button>
      </div>

      {error && !showModal && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-gray-500 dark:text-gray-400">Notities laden...</div>
      ) : notes.length > 0 ? (
        <div className="space-y-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">{note.title}</h4>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 p-1"
                  title="Notitie verwijderen"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>

              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-3">{note.note}</p>

              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>
                  Door: {note.expand?.author?.name || "Onbekend"}
                </span>
                <span>
                  {new Date(note.created).toLocaleString("nl-NL")}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-500 dark:text-gray-400">Nog geen notities toegevoegd</div>
      )}

      <DialogPanel open={showModal} onClose={closeModal} title="Notitie toevoegen">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="modal-title" required>
              Titel
            </Label>
            <Input
              id="modal-title"
              name="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Korte titel voor de notitie"
              required
            />
          </div>

          <div>
            <Label htmlFor="modal-note" required>
              Notitie
            </Label>
            <Textarea
              id="modal-note"
              name="note"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Voer hier je notitie in..."
              rows={5}
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              color="blue"
              text="Opslaan"
              disabled={formLoading}
              className="w-full md:w-auto md:min-w-[160px] justify-center"
            />
            <Button
              type="button"
              onClick={closeModal}
              color="gray"
              text="Annuleren"
              disabled={formLoading}
              className="w-full md:w-auto md:min-w-[160px] justify-center"
            />
          </div>
        </form>
      </DialogPanel>
    </div>
  );
};

export default RelationNotes;

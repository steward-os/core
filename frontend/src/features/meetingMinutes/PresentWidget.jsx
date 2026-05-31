import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { getUsers } from "../../services/userService";
import pb from "../../pb";

const formatName = (name) => {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return name;
  const last = parts.at(-1);
  const first = parts.slice(0, -1).join(" ");
  return `${last}, ${first}`;
};

const PresentWidget = ({ meeting, onUpdate, onMeetingUpdate }) => {
  const [allMembers, setAllMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [boardOnly, setBoardOnly] = useState(
    () => localStorage.getItem("presentWidget.boardOnly") !== "false"
  );

  const handleBoardOnlyChange = (checked) => {
    localStorage.setItem("presentWidget.boardOnly", checked);
    setBoardOnly(checked);
  };

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const membersList = await getUsers();
        setAllMembers(membersList);

        if (meeting.present && Array.isArray(meeting.present)) {
          setSelectedMembers(meeting.present);
        }
      } catch (error) {
        console.error("Error fetching members:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [meeting.present]);

  const dropdownMembers = allMembers
    .filter((m) => !selectedMembers.includes(m.id) && (!boardOnly || m.is_board_member))
    .sort((a, b) => a.name.split(" ").at(-1).localeCompare(b.name.split(" ").at(-1)));

  const handleMemberToggle = async (memberId) => {
    const newSelectedMembers = selectedMembers.includes(memberId)
      ? selectedMembers.filter((id) => id !== memberId)
      : [...selectedMembers, memberId];

    setSelectedMembers(newSelectedMembers);

    // Save to database
    setSaving(true);
    try {
      await pb.collection("bs_meetings").update(meeting.id, {
        present: newSelectedMembers,
      });
      if (onUpdate) {
        onUpdate();
      }
      if (onMeetingUpdate) {
        onMeetingUpdate();
      }
    } catch (error) {
      console.error("Error updating present members:", error);
      // Revert on error
      setSelectedMembers(selectedMembers);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <span className="font-medium  text-gray-700">Aanwezig:</span>
        <p className=" text-gray-500">Laden...</p>
      </div>
    );
  }

  return (
    <div className=" flex flex-wrap gap-2 mb-3 items-center">
      <span className="inline-flex items-center min-h-[28px] font-medium mr-2">Aanwezig:</span>
      {/* Selected members as tags */}
      {allMembers
        .filter((member) => selectedMembers.includes(member.id))
        .sort((a, b) => {
          const lastA = a.name.split(" ").at(-1);
          const lastB = b.name.split(" ").at(-1);
          return lastA.localeCompare(lastB);
        })
        .map((member) => (
          <span
            key={member.id}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 text-xs rounded-full min-h-[28px]"
          >
            {formatName(member.name)}
            <button
              onClick={() => handleMemberToggle(member.id)}
              disabled={saving}
              className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
            >
              <XMarkIcon className="w-3 h-3" />
            </button>
          </span>
        ))}
      {selectedMembers.length === 0 && <span className=" text-gray-500">Geen leden geselecteerd</span>}

      {/* Dropdown to add members */}
      {dropdownMembers.length > 0 && (
        <select
          disabled={saving}
          value=""
          onChange={(e) => { if (e.target.value) handleMemberToggle(e.target.value); }}
          className="text-xs border border-gray-300 rounded px-2 py-1 min-h-[28px] bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
        >
          <option value="">Voeg toe...</option>
          {dropdownMembers.map((member) => (
            <option key={member.id} value={member.id}>{formatName(member.name)}</option>
          ))}
        </select>
      )}

      {/* Board members only toggle */}
      <label className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
        <input
          type="checkbox"
          checked={boardOnly}
          onChange={(e) => handleBoardOnlyChange(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-gray-300"
        />
        Bestuursleden
      </label>

      {saving && <p className="text-xs text-gray-500">Opslaan...</p>}
    </div>
  );
};

export default PresentWidget;

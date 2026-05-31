import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import GroupDropdown from "../../components/GroupDropdown";
import SectionDropdown from "../../components/SectionDropdown";
import {
  createUser,
  createGroupMember,
  deleteGroupMember,
  getGroupMembers,
  updateUser,
} from "../../services/userService";

const UserEditForm = ({ user: initialUser, onClose, onSubmit }) => {
  initialUser = initialUser || { name: "", email: "" };

  const [user, setUser] = useState(initialUser);
  const [name, setName] = useState(initialUser.name || "");
  const [email, setEmail] = useState(initialUser.email || "");
  const [saving, setSaving] = useState(false);

  const [groupMembers, setGroupMembers] = useState([]);
  const [newGroup, setNewGroup] = useState("");
  const [newSection, setNewSection] = useState("");

  // Single fetch function
  const fetchGroupMembers = async (userId) => {
    if (!userId) {
      setGroupMembers([]);
      return;
    }
    try {
      const data = await getGroupMembers(userId);
      setGroupMembers(data);
    } catch (err) {
      console.error("Error fetching group_members:", err);
      setGroupMembers([]);
    }
  };

  // Fetch on user.id change
  useEffect(() => {
    fetchGroupMembers(user.id);
  }, [user.id]);

  // Add new group_member inline
  const handleAddGroupMember = async () => {
    try {
      let currentUser = user;
      if (!user.id) {
        currentUser = await createUser({
          name,
          email,
          password: "defaultPassword",
          passwordConfirm: "defaultPassword",
        });
        setUser(currentUser); // update local user state
      }

      await createUserGroupMember(currentUser.id, newGroup, newSection);
      setNewGroup("");
      setNewSection("");
      fetchGroupMembers(currentUser.id);
    } catch (err) {
      console.error("Error creating group_member:", err);
      alert("Fout bij toevoegen groeplid: " + (err.message || err));
    }
  };

  // Delete group_member
  const handleDeleteGroupMember = async (id) => {
    if (!window.confirm("Weet je zeker dat je dit lidmaatschap wilt verwijderen?")) return;
    try {
      awaitdeleteGroupMember(id);
      fetchGroupMembers(user.id);
    } catch (err) {
      console.error("Error deleting group_member:", err);
      alert("Fout bij verwijderen groeplid: " + (err.message || err));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (user.id) {
        await updateUser(user.id, { name, email });
      } else {
        await createUser({
          name,
          email,
          password: "defaultPassword",
          passwordConfirm: "defaultPassword",
        });
      }
      if (onSubmit) onSubmit();
      onClose();
    } catch (err) {
      console.error("Error saving user:", err);
      alert("Fout bij opslaan gebruiker: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block font-medium text-gray-700 mb-1">Naam</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block font-medium text-gray-700 mb-1">E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Group Members Table */}
        {user.id && (
          <div>
            <label className="block font-medium text-gray-700 mb-1">Lidmaatschappen</label>
            <table className="min-w-full mb-2 border border-gray-200 rounded">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-left font-semibold text-gray-700">Groep</th>
                  <th className="px-2 py-1 text-left font-semibold text-gray-700">Sectie</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {groupMembers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-gray-500 px-2 py-1">
                      Geen groepleden
                    </td>
                  </tr>
                ) : (
                  groupMembers.map((member) => (
                    <tr key={member.id}>
                      <td className="px-2 py-1">{member.expand.group?.name}</td>
                      <td className="px-2 py-1">{member.expand.section?.name}</td>
                      <td className="px-2 py-1 w-8">
                        <button
                          type="button"
                          onClick={() => handleDeleteGroupMember(member.id)}
                          className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                          aria-label="Verwijder lidmaatschap"
                        >
                          <XMarkIcon className="w-4 h-4 text-red-600" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Dropdowns for Group en Sectie */}
        <div>
          <div className="flex gap-4">
            <GroupDropdown value={newGroup} onChange={setNewGroup} />
            <SectionDropdown value={newSection} onChange={setNewSection} />
          </div>
          <button
            type="button"
            className={`mt-2 px-3 py-2 rounded-lg transition-colors
    ${
      !newGroup || !newSection
        ? "mt-4 bg-gray-300 text-gray-500 cursor-not-allowed"
        : "mt-4 bg-green-600 text-white hover:bg-green-700"
    }
  `}
            disabled={!newGroup || !newSection}
            onClick={handleAddGroupMember}
          >
            Toevoegen
          </button>
        </div>

        <div className="flex gap-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Annuleren
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-4 py-2 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {saving ? "Opslaan..." : "Opslaan"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserEditForm;

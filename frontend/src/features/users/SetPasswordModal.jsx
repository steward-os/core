import { useState } from "react";
import { Button } from "../../components/Button/Button";
import Input from "../../components/Form/Input";
import Label from "../../components/Form/Label";
import DialogPanel from "../../components/Modal/DialogPanel";
import { setUserPassword } from "../../services/userService";

const MIN_LENGTH = 8;

/** Lets an admin give a user a new password. The user is logged out everywhere afterwards. */
const SetPasswordModal = ({ open, onClose, user }) => {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const close = () => {
    setPassword("");
    setPasswordConfirm("");
    setError(null);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < MIN_LENGTH) {
      setError(`Het wachtwoord moet minimaal ${MIN_LENGTH} tekens lang zijn.`);
      return;
    }
    if (password !== passwordConfirm) {
      setError("De wachtwoorden komen niet overeen.");
      return;
    }
    setSaving(true);
    try {
      await setUserPassword(user.id, password, passwordConfirm);
      close();
      alert(`Het wachtwoord van ${user.name || user.email} is ingesteld.`);
    } catch (err) {
      console.error("Error setting password:", err);
      // Without manage access PocketBase asks for the old password, as if you were changing your own.
      const noRights = err.status === 403 || err.status === 404 || !!err.response?.data?.oldPassword;
      setError(
        noRights
          ? "Je hebt geen rechten om het wachtwoord van deze gebruiker in te stellen."
          : "Er is een fout opgetreden bij het instellen van het wachtwoord.",
      );
    }
    setSaving(false);
  };

  return (
    <DialogPanel open={open} onClose={close} title="Wachtwoord instellen">
      <form onSubmit={handleSubmit} className="space-y-4 p-6">
        <p className="text-sm text-[var(--text-secondary)]">
          Stel een nieuw wachtwoord in voor {user.name || user.email}. De gebruiker wordt daarna op alle apparaten
          uitgelogd.
        </p>
        <div>
          <Label htmlFor="new_password">Nieuw wachtwoord</Label>
          <Input
            id="new_password"
            name="new_password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="new_password_confirm">Bevestig wachtwoord</Label>
          <Input
            id="new_password_confirm"
            name="new_password_confirm"
            type="password"
            autoComplete="new-password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" onClick={close} color="gray" text="Annuleren" />
          <Button type="submit" disabled={saving} text={saving ? "Opslaan..." : "Wachtwoord instellen"} />
        </div>
      </form>
    </DialogPanel>
  );
};

export default SetPasswordModal;

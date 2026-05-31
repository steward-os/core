import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { confirmPasswordReset, authenticateWithPassword } from "../services/userService";
import Label from "../components/Form/Label";
import Input from "../components/Form/Input";

const SetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    passwordConfirm: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.password !== formData.passwordConfirm) {
      setError("Wachtwoorden komen niet overeen");
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError("Wachtwoord moet minimaal 8 karakters bevatten");
      setLoading(false);
      return;
    }

    try {
      // First confirm the password reset
      const resetResult = await confirmPasswordReset(token, formData.password, formData.passwordConfirm);
      
      // Extract email from the reset result or use the email from form
      const userEmail = resetResult.record?.email || formData.email;
      
      if (userEmail) {
        // Automatically log the user in with the new password
        await authenticateWithPassword(userEmail, formData.password);
        // Redirect to home page - user is now logged in
        window.location.href = "/";
      } else {
        // Fallback: redirect to login with success message
        navigate("/", { 
          state: { 
            message: "Wachtwoord succesvol gewijzigd. Je kunt nu inloggen met je nieuwe wachtwoord." 
          } 
        });
      }
    } catch (err) {
      console.error("Error confirming password reset:", err);
      if (err.message?.includes("token")) {
        setError("De reset link is verlopen of ongeldig. Vraag een nieuwe reset link aan.");
      } else {
        setError("Er is een fout opgetreden bij het instellen van het nieuwe wachtwoord.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-semibold text-center mb-6">Nieuw Wachtwoord</h1>
      <p className="text-sm text-gray-600 mb-6 text-center">
        Voer je nieuwe wachtwoord in.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">E-mailadres</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="je@email.com"
            required
          />
        </div>

        <div>
          <Label htmlFor="password">Nieuw Wachtwoord</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Minimaal 8 karakters"
            required
          />
        </div>

        <div>
          <Label htmlFor="passwordConfirm">Bevestig Wachtwoord</Label>
          <Input
            id="passwordConfirm"
            name="passwordConfirm"
            type="password"
            value={formData.passwordConfirm}
            onChange={handleInputChange}
            placeholder="Herhaal het nieuwe wachtwoord"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Bezig..." : "Wachtwoord Instellen"}
        </button>
      </form>

      {error && <div className="text-red-600 text-sm mt-4 text-center">{error}</div>}
    </div>
  );
};

export default SetPassword;
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../services/userService";
import Label from "../components/Form/Label";
import Input from "../components/Form/Input";

const ResetAccount = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await requestPasswordReset(email);
      setSuccess(true);
    } catch (err) {
      console.error("Error requesting password reset:", err);
      setError("Er is een fout opgetreden bij het versturen van de reset email.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-xl shadow-md">
        <h1 className="text-2xl font-semibold text-center mb-6">Email Verstuurd</h1>
        <div className="text-center space-y-4">
          <p className="text-green-600">Er is een wachtwoord reset link verstuurd naar je e-mailadres.</p>
          <p className="text-sm text-gray-600">
            Controleer je inbox en klik op de link om je wachtwoord opnieuw in te stellen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-semibold text-center mb-6">Wachtwoord Vergeten</h1>
      <p className="text-sm text-gray-600 mb-6 text-center">
        Voer je e-mailadres in om een wachtwoord reset link te ontvangen.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">E-mailadres</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="je@email.com"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Bezig..." : "Verstuur Reset Link"}
        </button>
      </form>

      {error && <div className="text-red-600 text-sm mt-4 text-center">{error}</div>}

      <div className="text-center mt-6">
        <Link to="/" className="text-blue-600 underline text-sm hover:text-blue-700">
          Terug naar inloggen
        </Link>
      </div>
    </div>
  );
};

export default ResetAccount;

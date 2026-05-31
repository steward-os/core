import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  authenticateWithGoogle,
  authenticateWithFacebook,
  authenticateWithPassword,
  requestPasswordReset,
} from "../../services/userService";
import posthog from "../../posthog";

const Auth = ({ onAuth }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [successMessage, setSuccessMessage] = useState(location.state?.message || "");

  // Clear the success message from history after showing it
  useEffect(() => {
    if (location.state?.message) {
      navigate(location.pathname, { replace: true });
    }
  }, [location.state?.message, navigate, location.pathname]);

  const handlePasswordReset = async () => {
    try {
      await requestPasswordReset(email);
      posthog.capture("password reset requested", { email });
      setResetEmailSent(true);
      setError("");
    } catch (err) {
      console.error("Error requesting password reset:", err);
      posthog.captureException(err);
      setError("Er is een fout opgetreden bij het versturen van de reset email.");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const authData = await authenticateWithGoogle();
      posthog.identify(authData.record?.id, {
        name: authData.record?.name,
        email: authData.record?.email,
      });
      posthog.capture("user logged in", { login_method: "google" });
      onAuth(authData);
      setError("");
    } catch (err) {
      console.error("Error with Google login:", err);
      posthog.captureException(err);
      setError("Google login failed. Please try again.");
    }
  };

  const handleFacebookLogin = async () => {
    try {
      const authData = await authenticateWithFacebook();
      onAuth(authData);
      setError("");
    } catch (err) {
      console.error("Error with Facebook login:", err);
      setError("Facebook login failed. Please try again.");
    }
  };

  const handlePasswordLogin = async () => {
    try {
      const authData = await authenticateWithPassword(email, password);
      posthog.identify(authData.record?.id, {
        name: authData.record?.name,
        email: authData.record?.email,
      });
      posthog.capture("user logged in", { login_method: "password" });
      onAuth(authData);
      setError("");
    } catch (err) {
      console.error("Error with password login:", err);
      posthog.captureException(err);
      setError("Onjuist e-mailadres of wachtwoord");
    }
  };

  return (
    <div className="max-w-xs mx-auto mt-16 p-6 glass-panel rounded-xl">
      <h3 className="text-xl font-semibold text-center mb-6 text-[var(--text-primary)]">{showResetForm ? "Wachtwoord vergeten" : "Inloggen"}</h3>

      {successMessage && (
        <div className="bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-300 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      {!showResetForm && !resetEmailSent && (
        <>
          <button
            onClick={handleGoogleLogin}
            className="w-full py-2 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors mb-3 flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Inloggen met Google</span>
          </button>

          {/* <button
            onClick={handleFacebookLogin}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors mb-4 flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span>Inloggen met Facebook</span>
          </button> */}

          <div className="text-center mb-4">
            <span className="text-[var(--text-secondary)] text-sm">of</span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handlePasswordLogin();
            }}
            className="space-y-4"
          >
            <input
              type="email"
              placeholder="E-mailadres"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--glass-bg)] border border-black/20 dark:border-white/20 rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="password"
              placeholder="Wachtwoord"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--glass-bg)] border border-black/20 dark:border-white/20 rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Inloggen
            </button>
          </form>

          <div className="text-center mt-4">
            <a
              href="/reset_account"
              className="text-blue-600 underline text-sm hover:text-blue-700"
            >
              Wachtwoord vergeten?
            </a>
          </div>
        </>
      )}

      {showResetForm && !resetEmailSent && (
        <>
          <p className="text-sm text-[var(--text-secondary)] mb-4 text-center">
            Voer je e-mailadres in om een wachtwoord reset link te ontvangen.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handlePasswordReset();
            }}
            className="space-y-4"
          >
            <input
              type="email"
              placeholder="E-mailadres"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--glass-bg)] border border-black/20 dark:border-white/20 rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Verstuur reset link
            </button>
          </form>

          <div className="text-center mt-4">
            <button
              type="button"
              className="text-blue-600 underline text-sm hover:text-blue-700"
              onClick={() => {
                setShowResetForm(false);
                setError("");
              }}
            >
              Terug naar inloggen
            </button>
          </div>
        </>
      )}

      {resetEmailSent && (
        <>
          <p className="text-green-600 dark:text-green-400 text-center mb-4">
            Er is een wachtwoord reset link verstuurd naar je e-mailadres.
          </p>
          <div className="text-center">
            <button
              type="button"
              className="text-blue-600 underline text-sm hover:text-blue-700"
              onClick={() => {
                setShowResetForm(false);
                setResetEmailSent(false);
                setError("");
              }}
            >
              Terug naar inloggen
            </button>
          </div>
        </>
      )}

      {error && <div className="text-red-600 dark:text-red-400 text-sm mt-4 text-center">{error}</div>}
    </div>
  );
};

export default Auth;

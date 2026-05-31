import pb from "../../pb";
import posthog from "../../posthog";

export default function Logout() {
  const handleLogout = () => {
    posthog.capture("user logged out");
    posthog.reset();
    pb.authStore.clear();
    window.location.href = "/";
  };

  return (
    <div className="max-w-sm mx-auto py-16 px-4 text-center">
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Uitloggen</h1>
      <p className="text-sm text-[var(--text-secondary)] mb-8">
        Weet je zeker dat je wilt uitloggen? Normaal gesproken is dit niet nodig.
      </p>
      <button
        onClick={handleLogout}
        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Uitloggen
      </button>
    </div>
  );
}

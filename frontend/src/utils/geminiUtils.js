export const GEMINI_MODELS = [
  { id: "llama3.3-70b", label: "Llama 3.3 70B (slim)" },
  { id: "llama3.1-8b", label: "Llama 3.1 8B (snel)" },
];

export const DEFAULT_GEMINI_MODEL = GEMINI_MODELS[0].id;

/**
 * Improve a meeting minute text via the backend AI proxy.
 * @param {string} text - Original minute text
 * @param {string} model - HuggingFace model ID
 * @returns {Promise<string>} Improved text
 */
export async function improveMinuteText(text, model = DEFAULT_GEMINI_MODEL) {
  const baseUrl = import.meta.env.VITE_POCKETBASE_URL || `http://${window.location.hostname}:8090`;
  const response = await fetch(`${baseUrl}/ai/improve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, model }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.message || `AI proxy fout: ${response.status}`);
  }

  const data = await response.json();
  if (!data.improved) throw new Error("Geen antwoord ontvangen");
  return data.improved;
}

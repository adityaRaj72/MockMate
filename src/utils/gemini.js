// Calls Google Gemini directly using user's API key from localStorage.
// `messages` is an array of { role: 'user' | 'assistant' | 'system', content: string }
export async function callGemini(messages) {
  const apiKey = import.meta.env.VITE_GEMINI_API;
  if (!apiKey) throw new Error("Missing Gemini API key");

  // Gemini doesn't support a "system" role in v1beta; merge any system messages
  // into the first user message so instructions are preserved.
  const systemTexts = messages.filter((m) => m.role === "system").map((m) => m.content);
  const convo = messages.filter((m) => m.role !== "system");

  const contents = convo.map((msg, idx) => {
    let text = msg.content;
    if (idx === 0 && msg.role === "user" && systemTexts.length) {
      text = `${systemTexts.join("\n\n")}\n\n${text}`;
    }
    return {
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text }],
    };
  });

  // If no user messages exist yet (only system), seed with system as the first user turn
  if (contents.length === 0 && systemTexts.length) {
    contents.push({ role: "user", parts: [{ text: systemTexts.join("\n\n") }] });
  }

  async function getAvailableModel(apiKey) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
  );

  if (!res.ok) throw new Error("Failed to list models");

  const data = await res.json();

  const model = data.models;

  return model;
}

  const models = await getAvailableModel(apiKey);
  let lastErr = null;

 for (let model in models) {
  console.log(models);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        lastErr = new Error(`Gemini ${response.status}: ${errBody.slice(0, 200)}`);
        // Try next model on 404 (model not found); otherwise stop.
        if (response.status === 404) continue;
        throw lastErr;
      }

      const data = await response.json();
      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ??
        data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ??
        "";
      if (!text) throw new Error("Empty response from Gemini");
      return text;
    } catch (err) {
      lastErr = err;
    }
  }

  throw lastErr || new Error("Gemini request failed");
}

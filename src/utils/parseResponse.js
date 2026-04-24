export function parseResponse(text) {
  if (!text || typeof text !== "string") return null;

  try {
    // remove markdown code blocks
    const cleaned = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    // safer JSON extraction using regex
    const match = cleaned.match(/\{[\s\S]*\}/);

    if (!match) return null;

    const jsonStr = match[0];

    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("Parse error:", err, text);
    return null;
  }
}
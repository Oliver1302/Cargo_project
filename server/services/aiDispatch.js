// Suggests the best driver for a shipment. Uses Claude if ANTHROPIC_API_KEY is set,
// otherwise falls back to a straightforward rule (lowest total miles, adjusted for hours
// risk) — so the dispatch board's "Suggest driver" button always returns something useful,
// and gets smarter automatically the moment a key is added.
export async function suggestDriver(shipment, driverCandidates) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || driverCandidates.length === 0) {
    return ruleBasedSuggestion(driverCandidates);
  }

  try {
    const prompt = `You are a freight dispatcher assistant. Given one shipment and a list of
available drivers with their computed stats, pick the single best driver and explain why in
one short sentence. Respond with ONLY valid JSON: {"driverId": number, "reason": string}.

Shipment: ${shipment.pro_number}, equipment needed: ${shipment.requested_equipment_type || "V"}

Drivers:
${driverCandidates
  .map(
    (d) =>
      `- id ${d.id}, ${d.name}: deadhead ${d.deadheadMiles ?? "unknown"} mi, loaded ${d.loadedMiles ?? "unknown"} mi, ` +
      `hours remaining ${d.hoursRemaining ?? "unknown"}, estimated margin $${d.margin ?? "unknown"}`
  )
  .join("\n")}`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }]
      })
    });
    const data = await res.json();
    const text = data.content?.[0]?.text || "";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    return { ...parsed, source: "ai" };
  } catch (err) {
    console.error("AI dispatch suggestion error:", err.message);
    return ruleBasedSuggestion(driverCandidates);
  }
}

function ruleBasedSuggestion(candidates) {
  if (candidates.length === 0) return { driverId: null, reason: "No available drivers.", source: "rule-based" };

  const sorted = [...candidates].sort((a, b) => (b.margin ?? -Infinity) - (a.margin ?? -Infinity));
  const best = sorted[0];
  return {
    driverId: best.id,
    reason: `Highest estimated margin ($${best.margin?.toFixed(0) ?? "n/a"}) among available drivers.`,
    source: "rule-based"
  };
}

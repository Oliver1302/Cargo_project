// Simulates an EDI trading-partner feed: every lifecycle event gets logged in the same
// shape a real EDI 204/990/214 exchange would produce. This is NOT wired to a real EDI VAN
// (SPS Commerce, TrueCommerce, etc.) — that requires a paid subscription and a trading
// partner (e.g. Walmart) to connect with. Swap this for real EDI calls once that's in place;
// every call-site below stays the same.
export async function logEdi(pool, shipmentId, messageType, summary) {
  try {
    await pool.query(
      "INSERT INTO edi_log (shipment_id, message_type, summary) VALUES ($1, $2, $3)",
      [shipmentId, messageType, summary]
    );
  } catch (err) {
    console.error("EDI log error:", err.message);
  }
}

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY is not configured" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const { systemPrompt, userMessage } = body;

    if (!systemPrompt || !userMessage) {
      return res.status(400).json({ error: "systemPrompt and userMessage are required" });
    }

    const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";

    const upstreamResponse = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    const data = await upstreamResponse.json();

    if (!upstreamResponse.ok) {
      return res.status(upstreamResponse.status).json({
        error: data?.error?.message || "Anthropic API request failed",
      });
    }

    const text = data?.content?.[0]?.text || "";
    return res.status(200).json({ text });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Unexpected server error" });
  }
};


module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { provider, model, messages } = req.body || {};

    if (!Array.isArray(messages) || !messages.length) {
      return res.status(400).json({ error: "No messages provided." });
    }

    const configs = {
      gemini: {
        key: process.env.GEMINI_API_KEY,
        url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      },
      groq: {
        key: process.env.GROQ_API_KEY,
        url: "https://api.groq.com/openai/v1/chat/completions",
      },
      openrouter: {
        key: process.env.OPENROUTER_API_KEY,
        url: "https://openrouter.ai/api/v1/chat/completions",
      },
    };

    const config = configs[provider];

    if (!config) {
      return res.status(400).json({ error: "Unknown provider." });
    }

    if (!config.key) {
      return res.status(500).json({ error: `Missing ${provider} API key in Vercel.` });
    }

    let response;

    if (provider === "gemini") {
      const contents = messages.slice(-30).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: String(m.content || "").slice(0, 12000) }],
      }));

      response = await fetch(`${config.url}?key=${encodeURIComponent(config.key)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
      });
    } else {
      response = await fetch(config.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.key}`,
        },
        body: JSON.stringify({
          model,
          messages: messages.slice(-30).map((m) => ({
            role: m.role,
            content: String(m.content || "").slice(0, 12000),
          })),
        }),
      });
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || data.message || "The AI provider returned an error.",
      });
    }

    const reply = provider === "gemini"
      ? data.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("")
      : data.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(502).json({ error: "The provider returned an empty response." });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Server error." });
  }
};


module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    let { provider, model, messages } = req.body || {};

    // Normalize provider names from the website
    provider = String(provider || "").toLowerCase().trim();

    if (provider.includes("gemini")) provider = "gemini";
    else if (provider.includes("groq")) provider = "groq";
    else if (provider.includes("openrouter")) provider = "openrouter";
    else {
      return res.status(400).json({
        error: `Unknown provider: ${provider || "empty"}.`
      });
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "No messages provided." });
    }

    if (!model || typeof model !== "string") {
      return res.status(400).json({ error: "Please select a model." });
    }

    const keys = {
      gemini: process.env.GEMINI_API_KEY,
      groq: process.env.GROQ_API_KEY,
      openrouter: process.env.OPENROUTER_API_KEY
    };

    const key = keys[provider];

    if (!key) {
      return res.status(500).json({
        error: `The ${provider} API key is missing from Vercel Environment Variables.`
      });
    }

    const cleanMessages = messages.slice(-30).map(message => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: String(message.content || "").slice(0, 12000)
    }));

    let response;
    let reply = "";

    if (provider === "gemini") {
      const contents = cleanMessages.map(message => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }]
      }));

      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents })
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return res.status(response.status).json({
          error: data.error?.message || "Gemini request failed."
        });
      }

      reply = (data.candidates?.[0]?.content?.parts || [])
        .map(part => part.text || "")
        .join("");

    } else {
      const endpoint = provider === "groq"
        ? "https://api.groq.com/openai/v1/chat/completions"
        : "https://openrouter.ai/api/v1/chat/completions";

      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
          ...(provider === "openrouter"
            ? { "X-Title": "7th Grade Encyclopedia AI" }
            : {})
        },
        body: JSON.stringify({
          model,
          messages: cleanMessages
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return res.status(response.status).json({
          error: data.error?.message || "AI provider request failed."
        });
      }

      reply = data.choices?.[0]?.message?.content || "";
    }

    if (!reply) {
      return res.status(502).json({
        error: "The AI provider returned an empty response."
      });
    }

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("Chat API error:", error);

    return res.status(500).json({
      error: "Something went wrong while contacting the AI provider."
    });
  }
};

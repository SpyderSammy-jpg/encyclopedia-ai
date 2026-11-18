
module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    // Normalize provider names
    let provider = String(req.query.provider || "").toLowerCase().trim();

    if (provider.includes("gemini")) provider = "gemini";
    else if (provider.includes("groq")) provider = "groq";
    else if (provider.includes("openrouter")) provider = "openrouter";
    else {
      return res.status(400).json({
        error: `Unknown provider: ${provider || "empty"}.`
      });
    }

    const keys = {
      gemini: process.env.GEMINI_API_KEY,
      groq: process.env.GROQ_API_KEY,
      openrouter: process.env.OPENROUTER_API_KEY
    };

    const key = keys[provider];

    if (!key) {
      return res.status(500).json({
        error: `The ${provider} API key is missing from Vercel.`
      });
    }

    let endpoint;

    if (provider === "gemini") {
      endpoint =
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`;
    } else if (provider === "groq") {
      endpoint = "https://api.groq.com/openai/v1/models";
    } else {
      endpoint = "https://openrouter.ai/api/v1/models";
    }

    const response = await fetch(endpoint, {
      headers: provider === "gemini"
        ? {}
        : { Authorization: `Bearer ${key}` }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "Could not retrieve available models."
      });
    }

    let models = [];

    if (provider === "gemini") {
      models = (data.models || [])
        .filter(model =>
          model.supportedGenerationMethods?.includes("generateContent")
        )
        .map(model => ({
          id: model.name.replace(/^models\//, ""),
          name: model.displayName || model.name.replace(/^models\//, "")
        }));

      // Put Flash-Lite first when it is available
      models.sort((a, b) => {
        if (a.id.includes("flash-lite")) return -1;
        if (b.id.includes("flash-lite")) return 1;
        return a.id.localeCompare(b.id);
      });

    } else {
      models = (data.data || []).map(model => ({
        id: model.id,
        name: model.name || model.id
      }));
    }

    return res.status(200).json({ models });

  } catch (error) {
    console.error("Models API error:", error);

    return res.status(500).json({
      error: "Unable to load the live model list."
    });
  }
};

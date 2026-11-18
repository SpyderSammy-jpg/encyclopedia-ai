
module.exports = async (req, res) => {
  const provider = req.query.provider;

  const configs = {
    gemini: {
      key: process.env.GEMINI_API_KEY,
      url: "https://generativelanguage.googleapis.com/v1beta/models",
    },
    groq: {
      key: process.env.GROQ_API_KEY,
      url: "https://api.groq.com/openai/v1/models",
    },
    openrouter: {
      key: process.env.OPENROUTER_API_KEY,
      url: "https://openrouter.ai/api/v1/models",
    },
  };

  try {
    const config = configs[provider];

    if (!config) {
      return res.status(400).json({ error: "Unknown provider." });
    }

    if (!config.key) {
      return res.status(500).json({ error: `Missing ${provider} API key.` });
    }

    const response = await fetch(
      provider === "gemini"
        ? `${config.url}?key=${encodeURIComponent(config.key)}`
        : config.url,
      {
        headers: provider === "gemini"
          ? {}
          : { Authorization: `Bearer ${config.key}` },
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "Could not retrieve models.",
      });
    }

    let models = [];

    if (provider === "gemini") {
      models = (data.models || [])
        .filter(m => m.supportedGenerationMethods?.includes("generateContent"))
        .map(m => m.name.replace(/^models\//, ""));
    } else {
      models = (data.data || []).map(m => m.id);
    }

    return res.status(200).json({ models });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Model loading failed." });
  }
};

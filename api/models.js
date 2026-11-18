
const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";
const GEMINI_MODELS_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const GROQ_MODELS_URL = "https://api.groq.com/openai/v1/models";

function getFamily(id = "") {
  const author = id.split("/")[0].toLowerCase();

  if (author.includes("openai")) return "OpenAI";
  if (author.includes("google")) return "Gemini";
  if (author.includes("deepseek")) return "DeepSeek";
  if (author.includes("anthropic")) return "Claude";
  if (author.includes("qwen")) return "Qwen";
  if (author.includes("meta-llama") || author.includes("llama")) return "Llama";
  return "Other";
}

async function getOpenRouterModels() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return [];

  const response = await fetch(OPENROUTER_MODELS_URL, {
    headers: { Authorization: `Bearer ${key}` }
  });

  if (!response.ok) {
    throw new Error("OpenRouter model request failed");
  }

  const result = await response.json();

  return (result.data || [])
    .filter(model => {
      const id = model.id || "";
      const architecture = model.architecture || {};
      const pricing = model.pricing || {};
      const endpoints = model.endpoints || [];

      const supportsTextInput =
        (architecture.input_modalities || []).includes("text");

      const supportsTextOutput =
        (architecture.output_modalities || []).includes("text");

      const supportsChat =
        endpoints.length === 0 ||
        endpoints.some(endpoint =>
          String(endpoint.name || endpoint.endpoint_type || "")
            .toLowerCase()
            .includes("chat")
        );

      return (
        id.endsWith(":free") &&
        !id.startsWith("~") &&
        supportsTextInput &&
        supportsTextOutput &&
        supportsChat &&
        Number(pricing.prompt || 0) === 0 &&
        Number(pricing.completion || 0) === 0
      );
    })
    .map(model => ({
      id: model.id,
      name: model.name || model.id,
      family: getFamily(model.id),
      provider: "OpenRouter"
    }));
}

async function getGeminiModels() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return [];

  const response = await fetch(
    `${GEMINI_MODELS_URL}?key=${encodeURIComponent(key)}`
  );

  if (!response.ok) {
    throw new Error("Gemini model request failed");
  }

  const result = await response.json();

  return (result.models || [])
    .filter(model =>
      model.name &&
      !model.name.startsWith("~") &&
      (model.supportedGenerationMethods || [])
        .includes("generateContent")
    )
    .map(model => ({
      id: model.name.replace(/^models\//, ""),
      name: model.displayName || model.name,
      family: "Gemini",
      provider: "Gemini"
    }));
}

async function getGroqModels() {
  const key = process.env.GROQ_API_KEY;
  if (!key) return [];

  const response = await fetch(GROQ_MODELS_URL, {
    headers: { Authorization: `Bearer ${key}` }
  });

  if (!response.ok) {
    throw new Error("Groq model request failed");
  }

  const result = await response.json();

  return (result.data || [])
    .filter(model =>
      model.id &&
      !model.id.startsWith("~") &&
      model.active !== false
    )
    .map(model => ({
      id: model.id,
      name: model.id,
      family: "ChatGPT",
      provider: "Groq"
    }));
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const [gemini, groq, openrouter] = await Promise.all([
      getGeminiModels(),
      getGroqModels(),
      getOpenRouterModels()
    ]);

    const groups = {
      Gemini: gemini,
      ChatGPT: groq,
      "OpenAI (OpenRouter)": openrouter.filter(m => m.family === "OpenAI"),
      "Gemini (OpenRouter)": openrouter.filter(m => m.family === "Gemini"),
      DeepSeek: openrouter.filter(m => m.family === "DeepSeek"),
      Claude: openrouter.filter(m => m.family === "Claude"),
      Qwen: openrouter.filter(m => m.family === "Qwen"),
      Llama: openrouter.filter(m => m.family === "Llama"),
      Other: openrouter.filter(m => m.family === "Other")
    };

    const models = Object.values(groups).flat();

    return res.status(200).json({
      success: true,
      groups,
      models
    });
  } catch (error) {
    console.error("Model loading error:", error);

    return res.status(500).json({
      success: false,
      error: "Could not load models. Check your API keys and try again."
    });
  }
}

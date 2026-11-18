
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const providerInput = String(req.query.provider || "")
    .trim()
    .toLowerCase();

  const providerAliases = {
    gemini: "gemini",
    "google gemini": "gemini",
    groq: "groq",
    chatgpt: "groq",
    openrouter: "openrouter"
  };

  const provider = providerAliases[providerInput];

  if (!provider) {
    return res.status(400).json({
      error: "Unknown provider. Choose Gemini, ChatGPT, or OpenRouter."
    });
  }

  const keys = {
    gemini: process.env.GEMINI_API_KEY,
    groq: process.env.GROQ_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY
  };

  const apiKey = keys[provider];

  if (!apiKey) {
    return res.status(500).json({
      error: `The ${provider} API key is missing. Add the correct environment variable in Vercel.`
    });
  }

  try {
    let models = [];

    if (provider === "gemini") {
      models = await getGeminiModels(apiKey);
    }

    if (provider === "groq") {
      models = await getGroqModels(apiKey);
    }

    if (provider === "openrouter") {
      models = await getOpenRouterModels(apiKey);
    }

    return res.status(200).json({
      provider,
      models
    });

  } catch (error) {
    console.error("Model list error:", error.message);

    return res.status(error.status || 502).json({
      error: error.message || "Unable to retrieve models."
    });
  }
}


async function readApiResponse(response) {
  const text = await response.text();

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `The provider returned an invalid response (HTTP ${response.status}).`
    );
  }

  if (!response.ok) {
    const message =
      data?.error?.message ||
      data?.message ||
      `Provider request failed with HTTP ${response.status}.`;

    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
}


async function getGeminiModels(apiKey) {
  const allModels = [];
  let pageToken = "";

  // Read multiple pages so the list is not limited to the first page.
  for (let page = 0; page < 5; page++) {
    const url = new URL(
      "https://generativelanguage.googleapis.com/v1beta/models"
    );

    url.searchParams.set("key", apiKey);
    url.searchParams.set("pageSize", "100");

    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }

    const response = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(20000)
    });

    const data = await readApiResponse(response);

    const pageModels = Array.isArray(data.models)
      ? data.models
      : [];

    allModels.push(...pageModels);

    pageToken = data.nextPageToken || "";

    if (!pageToken) break;
  }

  const compatible = allModels
    .filter(model => {
      const name = String(model.name || "")
        .replace(/^models\//, "");

      const supportsTextGeneration =
        Array.isArray(model.supportedGenerationMethods) &&
        model.supportedGenerationMethods.includes("generateContent");

      const requestedFamily =
        /^(gemini-(3|4)(-|$)|nano-banana)/i.test(name);

      return supportsTextGeneration && requestedFamily;
    })
    .map(model => String(model.name).replace(/^models\//, ""));

  // Prefer the requested default if Google actually returns it.
  compatible.sort((a, b) => {
    const aDefault = a === "gemini-3.5-flash-lite" ? 0 : 1;
    const bDefault = b === "gemini-3.5-flash-lite" ? 0 : 1;

    return aDefault - bDefault || a.localeCompare(b);
  });

  return [...new Set(compatible)];
}


async function getGroqModels(apiKey) {
  const response = await fetch(
    "https://api.groq.com/openai/v1/models",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json"
      },
      signal: AbortSignal.timeout(20000)
    }
  );

  const data = await readApiResponse(response);

  if (!Array.isArray(data.data)) {
    throw new Error("Groq returned an unexpected model list.");
  }

  return data.data
    .filter(model => {
      if (!model || typeof model.id !== "string") return false;
      if (model.active === false) return false;

      return true;
    })
    .map(model => model.id)
    .sort((a, b) => a.localeCompare(b));
}


async function getOpenRouterModels(apiKey) {
  const response = await fetch(
    "https://openrouter.ai/api/v1/models",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json"
      },
      signal: AbortSignal.timeout(20000)
    }
  );

  const data = await readApiResponse(response);

  if (!Array.isArray(data.data)) {
    throw new Error("OpenRouter returned an unexpected model list.");
  }

  return data.data
    .filter(model => {
      if (!model || typeof model.id !== "string") return false;

      const architecture = model.architecture || {};

      const inputModalities = architecture.input_modalities;
      const outputModalities = architecture.output_modalities;

      // Keep models that can accept and produce text.
      if (
        Array.isArray(inputModalities) &&
        !inputModalities.includes("text")
      ) {
        return false;
      }

      if (
        Array.isArray(outputModalities) &&
        !outputModalities.includes("text")
      ) {
        return false;
      }

      return true;
    })
    .map(model => model.id)
    .sort((a, b) => a.localeCompare(b));
}

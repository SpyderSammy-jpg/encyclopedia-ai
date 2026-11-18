
function normalizeProvider(provider) {
  const value = String(provider || "").toLowerCase();

  if (value === "gemini" || value === "google") return "gemini";
  if (value === "groq" || value === "chatgpt") return "groq";
  if (value === "openrouter") return "openrouter";

  throw new Error("Unknown provider");
}

function getMessages(messages) {
  if (!Array.isArray(messages)) {
    throw new Error("Messages must be an array");
  }

  return messages
    .filter(message =>
      message &&
      ["user", "assistant"].includes(message.role) &&
      typeof message.content === "string" &&
      message.content.trim()
    )
    .map(message => ({
      role: message.role,
      content: message.content.slice(0, 30000)
    }));
}

async function callOpenAICompatible(url, key, model, messages) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error("Chat provider error:", data);
    throw new Error(
      data.error?.message || `Provider request failed (${response.status})`
    );
  }

  const reply = data.choices?.[0]?.message?.content;

  if (typeof reply !== "string" || !reply.trim()) {
    throw new Error("The model returned an empty response");
  }

  return reply;
}

async function callGemini(key, model, messages) {
  const contents = messages.map(message => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }]
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7
        }
      })
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error("Gemini error:", data);
    throw new Error(
      data.error?.message || `Gemini request failed (${response.status})`
    );
  }

  const reply = (data.candidates?.[0]?.content?.parts || [])
    .map(part => part.text || "")
    .join("");

  if (!reply.trim()) {
    throw new Error("Gemini returned an empty response");
  }

  return reply;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { provider, model, messages } = req.body || {};

    const selectedProvider = normalizeProvider(provider);

    if (!model || typeof model !== "string") {
      return res.status(400).json({
        error: "Please select a model."
      });
    }

    const cleanMessages = getMessages(messages);

    if (!cleanMessages.length) {
      return res.status(400).json({
        error: "Please enter a message."
      });
    }

    let reply;

    if (selectedProvider === "gemini") {
      const key = process.env.GEMINI_API_KEY;

      if (!key) {
        throw new Error("Gemini API key is missing.");
      }

      reply = await callGemini(key, model, cleanMessages);
    }

    if (selectedProvider === "groq") {
      const key = process.env.GROQ_API_KEY;

      if (!key) {
        throw new Error("Groq API key is missing.");
      }

      reply = await callOpenAICompatible(
        "https://api.groq.com/openai/v1/chat/completions",
        key,
        model,
        cleanMessages
      );
    }

    if (selectedProvider === "openrouter") {
      const key = process.env.OPENROUTER_API_KEY;

      if (!key) {
        throw new Error("OpenRouter API key is missing.");
      }

      reply = await callOpenAICompatible(
        "https://openrouter.ai/api/v1/chat/completions",
        key,
        model,
        cleanMessages
      );
    }

    return res.status(200).json({
      success: true,
      provider: selectedProvider,
      model,
      reply
    });

  } catch (error) {
    console.error("Chat API error:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Something went wrong."
    });
  }
}

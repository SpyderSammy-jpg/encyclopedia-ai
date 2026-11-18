
function normalizeProvider(provider) {
  const value = String(provider || "").toLowerCase();

  if (value === "gemini" || value === "google") return "gemini";
  if (value === "groq" || value === "chatgpt") return "groq";
  if (value === "openrouter") return "openrouter";

  throw new Error("Unknown provider");
}

function cleanMessages(messages) {
  if (!Array.isArray(messages)) {
    throw new Error("Messages must be an array.");
  }

  return messages
    .filter(message =>
      message &&
      ["user", "assistant"].includes(message.role)
    )
    .map(message => {
      if (typeof message.content === "string") {
        return {
          role: message.role,
          content: message.content.slice(0, 100000)
        };
      }

      if (Array.isArray(message.content)) {
        return {
          role: message.role,
          content: message.content
        };
      }

      throw new Error("Invalid message content.");
    });
}

function hasImages(messages) {
  return messages.some(message =>
    Array.isArray(message.content) &&
    message.content.some(part =>
      part.type === "image_url"
    )
  );
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
    console.error("Provider error:", data);
    throw new Error(
      data.error?.message || `Provider error (${response.status})`
    );
  }

  const reply = data.choices?.[0]?.message?.content;

  if (typeof reply !== "string" || !reply.trim()) {
    throw new Error("The model returned no text response.");
  }

  return reply;
}

async function callGemini(key, model, messages) {
  const contents = messages.map(message => {
    const parts = typeof message.content === "string"
      ? [{ text: message.content }]
      : message.content.map(part => {
          if (part.type === "text") {
            return { text: part.text };
          }

          if (part.type === "image_url") {
            const url = part.image_url?.url || "";
            const match = url.match(
              /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/
            );

            if (!match) {
              throw new Error("Invalid image attachment.");
            }

            return {
              inlineData: {
                mimeType: match[1],
                data: match[2]
              }
            };
          }

          throw new Error("Unsupported attachment type.");
        });

    return {
      role: message.role === "assistant" ? "model" : "user",
      parts
    };
  });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: { temperature: 0.7 }
      })
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error("Gemini error:", data);
    throw new Error(
      data.error?.message || `Gemini error (${response.status})`
    );
  }

  const reply = (data.candidates?.[0]?.content?.parts || [])
    .map(part => part.text || "")
    .join("");

  if (!reply.trim()) {
    throw new Error("Gemini returned an empty response.");
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
    const {
      provider,
      model,
      messages
    } = req.body || {};

    if (!model || typeof model !== "string") {
      return res.status(400).json({
        error: "Select a model first."
      });
    }

    const selectedProvider = normalizeProvider(provider);
    const clean = cleanMessages(messages);

    if (!clean.length) {
      return res.status(400).json({
        error: "Enter a message first."
      });
    }

    let reply;

    if (selectedProvider === "gemini") {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("Gemini API key is missing.");
      }

      reply = await callGemini(
        process.env.GEMINI_API_KEY,
        model,
        clean
      );
    }

    if (selectedProvider === "groq") {
      if (!process.env.GROQ_API_KEY) {
        throw new Error("Groq API key is missing.");
      }

      if (hasImages(clean)) {
        throw new Error(
          "Image attachments require a compatible vision model. Use Gemini or a vision-capable OpenRouter model."
        );
      }

      reply = await callOpenAICompatible(
        "https://api.groq.com/openai/v1/chat/completions",
        process.env.GROQ_API_KEY,
        model,
        clean
      );
    }

    if (selectedProvider === "openrouter") {
      if (!process.env.OPENROUTER_API_KEY) {
        throw new Error("OpenRouter API key is missing.");
      }

      reply = await callOpenAICompatible(
        "https://openrouter.ai/api/v1/chat/completions",
        process.env.OPENROUTER_API_KEY,
        model,
        clean
      );
    }

    return res.status(200).json({
      success: true,
      provider: selectedProvider,
      model,
      reply
    });

  } catch (error) {
    console.error("Chat error:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Something went wrong."
    });
  }
}

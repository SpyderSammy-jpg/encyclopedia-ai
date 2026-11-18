
const SYSTEM_INSTRUCTION = `
You are 7th Grade Encyclopedia AI, a helpful educational assistant.

Explain topics clearly and accurately.
Use language that is easy for a middle-school student to understand.
Break complicated topics into smaller steps when useful.
For math, show the working and explain how to get the answer.
For school assignments, help the student understand the material.
Be friendly, patient, and respectful.
Do not invent facts. If you are unsure, say so.
`;


export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      error: "Method not allowed. Use POST."
    });
  }

  try {
    const body = req.body || {};

    const providerInput = String(body.provider || "")
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
        error: `The ${provider} API key is missing. Check your Vercel environment variables.`
      });
    }

    const model = String(body.model || "").trim();

    if (
      !model ||
      model.length > 200 ||
      !/^[a-zA-Z0-9._:/-]+$/.test(model)
    ) {
      return res.status(400).json({
        error: "Please select a valid model."
      });
    }

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return res.status(400).json({
        error: "No chat messages were provided."
      });
    }

    if (body.messages.length > 60) {
      return res.status(400).json({
        error: "This conversation is too long. Start a new chat."
      });
    }

    const messages = body.messages.map(message => {
      const role = message?.role;

      if (role !== "user" && role !== "assistant") {
        throw new Error("A message has an invalid role.");
      }

      if (typeof message.content !== "string") {
        throw new Error("A message has invalid content.");
      }

      if (message.content.length > 30000) {
        throw new Error("A message is too long.");
      }

      return {
        role,
        content: message.content
      };
    });

    let reply;

    if (provider === "gemini") {
      reply = await askGemini(apiKey, model, messages);
    } else {
      reply = await askOpenAICompatible(
        provider,
        apiKey,
        model,
        messages
      );
    }

    if (!reply || !reply.trim()) {
      throw new Error(
        "The model returned an empty response. Try another model."
      );
    }

    return res.status(200).json({
      provider,
      model,
      reply
    });

  } catch (error) {
    console.error("Chat API error:", error.message);

    const status = error.status || 500;

    return res.status(status).json({
      error: error.message || "Something went wrong while generating a response."
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
      `The AI provider returned an invalid response (HTTP ${response.status}).`
    );
  }

  if (!response.ok) {
    const message =
      data?.error?.message ||
      data?.error?.metadata?.raw ||
      data?.message ||
      `The AI provider returned HTTP ${response.status}.`;

    const error = new Error(message);
    error.status = response.status;

    throw error;
  }

  return data;
}


async function askGemini(apiKey, model, messages) {
  const cleanModel = model.replace(/^models\//, "");

  const contents = messages.map(message => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [
      {
        text: message.content
      }
    ]
  }));

  const url = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cleanModel)}:generateContent`
  );

  url.searchParams.set("key", apiKey);

  const response = await fetch(url, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },

    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text: SYSTEM_INSTRUCTION
          }
        ]
      },

      contents,

      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096
      }
    }),

    signal: AbortSignal.timeout(90000)
  });

  const data = await readApiResponse(response);

  const candidates = data.candidates || [];

  const parts =
    candidates[0]?.content?.parts || [];

  const textParts = parts
    .filter(part => typeof part.text === "string")
    .map(part => part.text);

  if (!textParts.length) {
    throw new Error(
      "Gemini did not return a text response. This model may produce images or another output type that the current chat interface cannot display."
    );
  }

  return textParts.join("\n");
}


async function askOpenAICompatible(
  provider,
  apiKey,
  model,
  messages
) {
  let endpoint;

  if (provider === "groq") {
    endpoint = "https://api.groq.com/openai/v1/chat/completions";
  } else if (provider === "openrouter") {
    endpoint = "https://openrouter.ai/api/v1/chat/completions";
  } else {
    throw new Error("Unsupported provider.");
  }

  const apiMessages = [
    {
      role: "system",
      content: SYSTEM_INSTRUCTION
    },
    ...messages
  ];

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json"
  };

  if (provider === "openrouter") {
    headers["HTTP-Referer"] = "https://7th-grade-encyclopedia-ai.vercel.app";
    headers["X-OpenRouter-Title"] = "7th Grade Encyclopedia AI";
  }

  const response = await fetch(endpoint, {
    method: "POST",

    headers,

    body: JSON.stringify({
      model,
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 4096,
      stream: false
    }),

    signal: AbortSignal.timeout(90000)
  });

  const data = await readApiResponse(response);

  const content = data.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .filter(part => part && typeof part.text === "string")
      .map(part => part.text)
      .join("\n");
  }

  throw new Error(
    "The provider did not return a readable text response."
  );
}

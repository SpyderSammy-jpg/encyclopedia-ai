const GEMINI_API_MODEL = "gemini-3-flash-preview";

const GEMINI_PROFILES = {
  "gemini-3-flash": {
    name: "Gemini 3 Flash",
    instruction: "Your profile name is Gemini 3 Flash."
  },
  "gemini-3-1": {
    name: "Gemini 3.1",
    instruction: "Your profile name is Gemini 3.1."
  },
  "gemini-3-1-pro": {
    name: "Gemini 3.1 Pro",
    instruction: "Your profile name is Gemini 3.1 Pro."
  },
  "gemini-3-5-flash": {
    name: "Gemini 3.5 Flash",
    instruction: "Your profile name is Gemini 3.5 Flash."
  },
  "gemini-3-6-flash": {
    name: "Gemini 3.6 Flash",
    instruction: "Your profile name is Gemini 3.6 Flash."
  },
  "gemini-3-7-flash": {
    name: "Gemini 3.7 Flash",
    instruction: "Your profile name is Gemini 3.7 Flash."
  },
  "gemini-3-8-flash": {
    name: "Gemini 3.8 Flash",
    instruction: "Your profile name is Gemini 3.8 Flash."
  },
  "gemini-4-hydrogen": {
    name: "Gemini 4 Hydrogen",
    instruction: "Your profile name is Gemini 4 Hydrogen."
  },
  "gemini-4-argon": {
    name: "Gemini 4 Argon",
    instruction: "Your profile name is Gemini 4 Argon."
  },
  "gemini-4-carbon": {
    name: "Gemini 4 Carbon",
    instruction: "Your profile name is Gemini 4 Carbon."
  },
  "gemini-4-neon": {
    name: "Gemini 4 Neon",
    instruction: "Your profile name is Gemini 4 Neon."
  }
};

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

function toGeminiContents(messages) {
  return messages.map(message => {
    const parts = typeof message.content === "string"
      ? [{ text: message.content }]
      : message.content.map(part => {
          if (part.type === "text") {
            return { text: String(part.text || "") };
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
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const { provider, model, messages } = req.body || {};

    const normalizedProvider = String(provider || "").toLowerCase();

    if (!["gemini", "google"].includes(normalizedProvider)) {
      return res.status(400).json({
        success: false,
        error: "Only Gemini is enabled right now."
      });
    }

    if (typeof model !== "string" || !model) {
      return res.status(400).json({
        success: false,
        error: "Select a Gemini profile first."
      });
    }

    const profile = GEMINI_PROFILES[model];

    if (!profile) {
      return res.status(400).json({
        success: false,
        error: "Unknown Gemini profile."
      });
    }

    const clean = cleanMessages(messages);

    if (!clean.length) {
      return res.status(400).json({
        success: false,
        error: "Enter a message first."
      });
    }

    const key = process.env.GEMINI_API_KEY;

    if (!key) {
      throw new Error("Gemini API key is missing.");
    }

    const systemInstruction = {
      parts: [{
        text:
          "You are an AI assistant in AI Service. " +
          profile.instruction +
          " Use this profile name when asked which profile is selected. " +
          "Be helpful, accurate, clear, and natural."
      }]
    };

    const upstreamUrl =
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_API_MODEL}:streamGenerateContent?alt=sse&key=${encodeURIComponent(key)}`;

    const upstream = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "text/event-stream"
      },
      body: JSON.stringify({
        systemInstruction,
        contents: toGeminiContents(clean),
        generationConfig: {
          temperature: 0.7
        }
      })
    });

    if (!upstream.ok) {
      const errorData = await upstream.json().catch(() => ({}));

      console.error("Gemini error:", errorData);

      return res.status(upstream.status).json({
        success: false,
        error:
          errorData.error?.message ||
          `Gemini error (${upstream.status})`
      });
    }

    if (!upstream.body) {
      throw new Error("Gemini did not return a response stream.");
    }

    res.statusCode = 200;

    res.setHeader(
      "Content-Type",
      "text/event-stream; charset=utf-8"
    );

    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    if (typeof res.flushHeaders === "function") {
      res.flushHeaders();
    }

    const reader = upstream.body.getReader();

    while (true) {
      const { value, done } = await reader.read();

      if (done) break;

      if (res.destroyed) {
        await reader.cancel().catch(() => {});
        return;
      }

      if (!res.write(Buffer.from(value))) {
        await new Promise(resolve => res.once("drain", resolve));
      }
    }

    return res.end();

  } catch (error) {
    console.error("Chat error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: error.message || "Something went wrong."
      });
    }

    return res.end();
  }
}

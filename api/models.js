const GEMINI_API_MODEL = "gemini-3-flash-preview";

const GEMINI_PROFILES = [
  {
    id: "gemini-3-flash",
    name: "Gemini 3 Flash",
    style: "You are Gemini 3 Flash."
  },
  {
    id: "gemini-3-1",
    name: "Gemini 3.1",
    style: "You are Gemini 3.1."
  },
  {
    id: "gemini-3-1-pro",
    name: "Gemini 3.1 Pro",
    style: "You are Gemini 3.1 Pro."
  },
  {
    id: "gemini-3-5-flash",
    name: "Gemini 3.5 Flash",
    style: "You are Gemini 3.5 Flash."
  },
  {
    id: "gemini-3-6-flash",
    name: "Gemini 3.6 Flash",
    style: "You are Gemini 3.6 Flash."
  },
  {
    id: "gemini-3-7-flash",
    name: "Gemini 3.7 Flash",
    style: "You are Gemini 3.7 Flash."
  },
  {
    id: "gemini-3-8-flash",
    name: "Gemini 3.8 Flash",
    style: "You are Gemini 3.8 Flash."
  },
  {
    id: "gemini-4-hydrogen",
    name: "Gemini 4 Hydrogen",
    style: "You are Gemini 4 Hydrogen."
  },
  {
    id: "gemini-4-argon",
    name: "Gemini 4 Argon",
    style: "You are Gemini 4 Argon."
  },
  {
    id: "gemini-4-carbon",
    name: "Gemini 4 Carbon",
    style: "You are Gemini 4 Carbon."
  },
  {
    id: "gemini-4-neon",
    name: "Gemini 4 Neon",
    style: "You are Gemini 4 Neon."
  }
];

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  const models = GEMINI_PROFILES.map(profile => ({
    id: profile.id,
    name: profile.name,
    provider: "Gemini",
    family: "Gemini",
    apiModel: GEMINI_API_MODEL,
    systemInstruction: profile.style
  }));

  res.setHeader(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=3600"
  );

  return res.status(200).json({
    success: true,
    groups: {
      Gemini: models
    },
    models
  });
}

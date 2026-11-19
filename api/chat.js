<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI Service</title>

<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/dompurify@3.2.6/dist/purify.min.js"></script>
<script src="https://elfsightcdn.com/platform.js" async></script>

<style>
:root {
  --bg: #101010;
  --panel: #181818;
  --panel2: #242424;
  --text: #f5f5f5;
  --muted: #999;
  --red: #e63946;
  --border: #333;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  height: 100vh;
  overflow: hidden;
  background: var(--bg);
  color: var(--text);
  font-family: Arial, sans-serif;
}

button, input, textarea, select { font: inherit; }
button { cursor: pointer; }
button:disabled { opacity: .5; cursor: not-allowed; }

.app {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: 270px;
  flex-shrink: 0;
  background: #151515;
  border-right: 1px solid var(--border);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 13px;
}

.brand {
  font-size: 22px;
  font-weight: bold;
  padding: 10px 5px;
}

.brand span { color: var(--red); }

.primary {
  background: var(--red);
  color: white;
  border: 0;
  border-radius: 9px;
  padding: 12px;
  font-weight: bold;
}

.secondary {
  background: var(--panel2);
  color: white;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 9px 12px;
}

select, input, textarea {
  background: var(--panel2);
  color: white;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 11px;
  outline: none;
  width: 100%;
}

select:focus, input:focus, textarea:focus {
  border-color: var(--red);
}

.section-label {
  color: var(--muted);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 7px;
}

.history {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 9px;
  border-radius: 8px;
  margin-bottom: 4px;
}

.history-item:hover,
.history-item.active {
  background: var(--panel2);
}

.history-title {
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 13px;
  cursor: pointer;
}

.history-actions button {
  background: transparent;
  color: #aaa;
  border: 0;
  font-size: 19px;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.topbar {
  height: 58px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 25px max(20px, calc((100% - 850px)/2));
}

.welcome {
  text-align: center;
  margin: 100px auto 40px;
  max-width: 600px;
}

.welcome h1 { font-size: 34px; }
.welcome p { color: var(--muted); }

.message {
  display: flex;
  gap: 13px;
  margin: 24px 0;
  align-items: flex-start;
}

.avatar {
  min-width: 34px;
  height: 34px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--panel2);
  font-size: 12px;
  font-weight: bold;
}

.message.user .avatar { background: var(--red); }

.content {
  line-height: 1.65;
  min-width: 0;
  overflow-wrap: anywhere;
  flex: 1;
}

.content p:first-child { margin-top: 0; }

.content pre {
  background: #090909;
  border: 1px solid var(--border);
  padding: 15px;
  border-radius: 10px;
  overflow-x: auto;
  white-space: pre;
}

.content code {
  font-family: Consolas, monospace;
}

.content :not(pre) > code {
  background: #292929;
  padding: 2px 5px;
  border-radius: 4px;
}

.content img {
  max-width: 100%;
  border-radius: 10px;
}

.content table {
  border-collapse: collapse;
  width: 100%;
}

.content td,
.content th {
  border: 1px solid var(--border);
  padding: 8px;
}

.composer-area {
  padding: 12px 20px 18px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

.composer {
  max-width: 850px;
  margin: auto;
  border: 1px solid #444;
  background: var(--panel);
  border-radius: 15px;
  padding: 10px;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.toolbar button {
  background: var(--panel2);
  color: white;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 7px 10px;
  font-size: 12px;
}

#prompt {
  border: 0;
  background: transparent;
  resize: none;
  min-height: 65px;
  max-height: 180px;
  font-size: 15px;
}

.composer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.composer-bottom button {
  border: 0;
  border-radius: 8px;
  padding: 10px 15px;
}

.send {
  background: var(--red);
  color: white;
  font-weight: bold;
}

.upload {
  background: var(--panel2);
  color: white;
}

.status {
  color: var(--muted);
  font-size: 12px;
  text-align: center;
  padding: 5px;
}

#fileInput { display: none; }

.attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin: 8px 0;
}

.attachment {
  background: #292929;
  border: 1px solid #444;
  padding: 7px 10px;
  border-radius: 7px;
  font-size: 12px;
}

.attachment button {
  background: none;
  color: white;
  border: 0;
  margin-left: 5px;
}

.encyclopedia-panel {
  display: none;
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 16px;
  background: var(--bg);
}

.encyclopedia-panel.active { display: block; }

.encyclopedia-widget {
  width: 100%;
  min-height: 70vh;
  height: 100%;
  max-width: 1100px;
  margin: 0 auto;
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  background: var(--panel);
  padding: 10px;
}

.encyclopedia-widget > div {
  min-height: 65vh;
}

@media(max-width:700px) {
  .sidebar { width: 190px; padding: 9px; }
  .messages { padding: 15px; }
  .composer-area { padding: 8px; }
}

@media(max-width:500px) {
  .sidebar { width: 145px; }
  .brand { font-size: 16px; }
  .topbar { padding: 10px; }
}
</style>
</head>

<body>
<div class="app">

<aside class="sidebar">

  <div class="brand">AI <span>Service</span></div>

  <button class="primary" onclick="newChat()">
    + New Chat
  </button>

  <div class="section-label">Provider</div>

  <select id="provider" onchange="providerChanged()">
    <option value="Gemini">Gemini</option>
    <option value="Encyclopedia AI">Encyclopedia AI</option>
  </select>

  <div class="section-label" id="modelLabel">
    Model
  </div>

  <select id="model">
    <option value="gemini-3-flash">Gemini 3 Flash</option>
    <option value="gemini-3-1">Gemini 3.1</option>
    <option value="gemini-3-1-pro">Gemini 3.1 Pro</option>
    <option value="gemini-3-5-flash">Gemini 3.5 Flash</option>
    <option value="gemini-3-6-flash">Gemini 3.6 Flash</option>
    <option value="gemini-3-7-flash">Gemini 3.7 Flash</option>
    <option value="gemini-3-8-flash">Gemini 3.8 Flash</option>
    <option value="gemini-4-hydrogen">Gemini 4 Hydrogen</option>
    <option value="gemini-4-argon">Gemini 4 Argon</option>
    <option value="gemini-4-carbon">Gemini 4 Carbon</option>
    <option value="gemini-4-neon">Gemini 4 Neon</option>
  </select>

  <div class="section-label">Your chats</div>

  <div class="history" id="history"></div>

  <div class="status" id="modelStatus">
    Loading Gemini profiles...
  </div>

</aside>

<main class="main">

  <header class="topbar">
    <strong id="chatTitle">New Chat</strong>
    <button class="secondary" onclick="newChat()">
      New Chat
    </button>
  </header>

  <section class="messages" id="messages">
    <div class="welcome">
      <h1>What can I help with?</h1>
      <p>Ask anything. Let's get started.</p>
    </div>
  </section>

  <section
    class="encyclopedia-panel"
    id="encyclopediaPanel"
    aria-label="Encyclopedia AI"
  >
    <div class="encyclopedia-widget">
      <div
        class="elfsight-app-7568ba73-5055-478b-b276-749a252f0d1e"
        data-elfsight-app-lazy>
      </div>
    </div>
  </section>

  <section class="composer-area" id="composerArea">

    <div class="composer">

      <div class="toolbar">
        <button onclick="formatText('**','**')">
          <b>B</b>
        </button>

        <button onclick="formatText('*','*')">
          <i>I</i>
        </button>

        <button onclick="formatText('<u>','</u>')">
          <u>U</u>
        </button>

        <button onclick="formatText('## ','')">
          Heading
        </button>

        <button onclick="formatText('- ','')">
          • List
        </button>

        <button onclick="formatText('1. ','')">
          1. List
        </button>

        <button onclick="formatText('> ','')">
          Quote
        </button>
      </div>

      <textarea
        id="prompt"
        placeholder="Message AI Service..."
        onkeydown="handleEnter(event)"
      ></textarea>

      <div class="attachments" id="attachments"></div>

      <div class="composer-bottom">

        <div>
          <button
            class="upload"
            onclick="document.getElementById('fileInput').click()"
          >
            + Upload
          </button>

          <input
            id="fileInput"
            type="file"
            multiple
            onchange="handleFiles(event)"
          >
        </div>

        <button
          class="send"
          id="sendButton"
          onclick="sendMessage()"
        >
          Send ↑
        </button>

      </div>
    </div>

    <div class="status">
      AI responses may contain mistakes. Check important information.
    </div>

  </section>

</main>
</div>

<script>
/* =========================================
   AI SERVICE
========================================= */

const FALLBACK_GEMINI_MODELS = [
  { id: "gemini-3-flash", name: "Gemini 3 Flash", provider: "Gemini", family: "Gemini" },
  { id: "gemini-3-1", name: "Gemini 3.1", provider: "Gemini", family: "Gemini" },
  { id: "gemini-3-1-pro", name: "Gemini 3.1 Pro", provider: "Gemini", family: "Gemini" },
  { id: "gemini-3-5-flash", name: "Gemini 3.5 Flash", provider: "Gemini", family: "Gemini" },
  { id: "gemini-3-6-flash", name: "Gemini 3.6 Flash", provider: "Gemini", family: "Gemini" },
  { id: "gemini-3-7-flash", name: "Gemini 3.7 Flash", provider: "Gemini", family: "Gemini" },
  { id: "gemini-3-8-flash", name: "Gemini 3.8 Flash", provider: "Gemini", family: "Gemini" },
  { id: "gemini-4-hydrogen", name: "Gemini 4 Hydrogen", provider: "Gemini", family: "Gemini" },
  { id: "gemini-4-argon", name: "Gemini 4 Argon", provider: "Gemini", family: "Gemini" },
  { id: "gemini-4-carbon", name: "Gemini 4 Carbon", provider: "Gemini", family: "Gemini" },
  { id: "gemini-4-neon", name: "Gemini 4 Neon", provider: "Gemini", family: "Gemini" }
];

let groups = { Gemini: FALLBACK_GEMINI_MODELS };
let chats = [];
let currentChatId = null;
let selectedFiles = [];
let busy = false;

const $ = id => document.getElementById(id);

if (window.marked && typeof window.marked.setOptions === "function") {
  window.marked.setOptions({ breaks: true, gfm: true });
}

function makeId() {
  return Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8);
}

function currentChat() {
  return chats.find(chat => chat.id === currentChatId);
}

function saveChats() {
  try {
    localStorage.setItem(
      "ai_service_chats",
      JSON.stringify(chats)
    );
  } catch (error) {
    console.error("Could not save chats:", error);
  }
}

/* =========================================
   CHAT HISTORY
========================================= */

function loadChats() {
  try {
    chats = JSON.parse(
      localStorage.getItem("ai_service_chats") || "[]"
    );

    if (!Array.isArray(chats)) chats = [];

  } catch (error) {
    console.error("Chat history error:", error);
    chats = [];
  }

  chats.forEach(chat => {
    chat.provider = "Gemini";

    if (!Array.isArray(chat.messages)) {
      chat.messages = [];
    }
  });

  const savedProvider =
    localStorage.getItem("ai_service_provider");

  $("provider").value =
    savedProvider === "Encyclopedia AI"
      ? "Encyclopedia AI"
      : "Gemini";

  if (chats.length) {
    currentChatId = chats[0].id;

    renderChat();
    renderHistory();

  } else {
    createFirstChat();
  }

  updateProviderView();
}

function createFirstChat() {
  const chat = {
    id: makeId(),
    title: "New Chat",
    messages: [],
    provider: "Gemini",
    model: ""
  };

  chats.unshift(chat);
  currentChatId = chat.id;

  saveChats();
  renderChat();
  renderHistory();
}

function newChat() {
  $("provider").value = "Gemini";

  localStorage.setItem(
    "ai_service_provider",
    "Gemini"
  );

  const chat = {
    id: makeId(),
    title: "New Chat",
    messages: [],
    provider: "Gemini",
    model: $("model").value
  };

  chats.unshift(chat);
  currentChatId = chat.id;

  saveChats();
  renderChat();
  renderHistory();
  updateProviderView();

  $("prompt").focus();
}

function renderHistory() {
  $("history").innerHTML = "";

  chats.forEach(chat => {
    const item = document.createElement("div");

    item.className =
      "history-item" +
      (chat.id === currentChatId ? " active" : "");

    const title = document.createElement("span");

    title.className = "history-title";
    title.textContent = chat.title;

    title.onclick = () => {
      currentChatId = chat.id;

      $("provider").value = "Gemini";

      localStorage.setItem(
        "ai_service_provider",
        "Gemini"
      );

      renderChat();
      updateModels(chat.model || "");
      updateProviderView();
      renderHistory();
    };

    const actions = document.createElement("div");
    actions.className = "history-actions";

    const menu = document.createElement("button");
    menu.textContent = "⋯";
    menu.title = "Rename or delete chat";

    menu.onclick = event => {
      event.stopPropagation();

      const choice = prompt(
        "Type rename or delete:"
      );

      if (choice?.toLowerCase() === "rename") {
        const name = prompt(
          "New chat name:",
          chat.title
        );

        if (name && name.trim()) {
          chat.title = name.trim();

          saveChats();
          renderHistory();

          if (chat.id === currentChatId) {
            $("chatTitle").textContent = chat.title;
          }
        }
      }

      if (choice?.toLowerCase() === "delete") {
        if (!confirm("Delete this chat?")) return;

        chats = chats.filter(
          current => current.id !== chat.id
        );

        if (currentChatId === chat.id) {
          currentChatId = chats[0]?.id || null;

          if (!currentChatId) {
            createFirstChat();
          } else {
            renderChat();
          }
        }

        saveChats();
        renderHistory();
      }
    };

    actions.appendChild(menu);
    item.append(title, actions);

    $("history").appendChild(item);
  });
}

/* =========================================
   MESSAGE DISPLAY
========================================= */

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[character]);
}

function renderMarkdown(text) {
  const source = String(text || "");

  // If either CDN library is unavailable, show safe plain text
  // instead of allowing startup or chat history to crash.
  if (!window.marked || typeof window.marked.parse !== "function" ||
      !window.DOMPurify || typeof window.DOMPurify.sanitize !== "function") {
    return escapeHTML(source).replace(/\n/g, "<br>");
  }

  try {
    return window.DOMPurify.sanitize(window.marked.parse(source));
  } catch (error) {
    console.warn("Markdown rendering fallback:", error);
    return escapeHTML(source).replace(/\n/g, "<br>");
  }
}

function renderChat() {
  const chat = currentChat();

  if (!chat) return;

  $("chatTitle").textContent = chat.title;
  $("messages").innerHTML = "";

  if (!chat.messages.length) {
    $("messages").innerHTML = `
      <div class="welcome">
        <h1>What can I help with?</h1>
        <p>Ask anything. Let's get started.</p>
      </div>
    `;

    return;
  }

  chat.messages.forEach(message => {
    let display = message.content;

    if (Array.isArray(display)) {
      display = display.map(part => {
        if (part.type === "text") {
          return part.text;
        }

        if (part.type === "image_url") {
          return "[Image attached]";
        }

        return "";
      }).join("\n");
    }

    addMessage(message.role, display);
  });
}

function addMessage(role, content) {
  const message = document.createElement("div");

  message.className = "message " + role;

  const avatar = document.createElement("div");

  avatar.className = "avatar";
  avatar.textContent =
    role === "user" ? "YOU" : "AI";

  const body = document.createElement("div");

  body.className = "content";
  body.innerHTML = renderMarkdown(content);

  // No Highlight.js or code-preview dependency.
  // Normal Markdown code blocks still display correctly.

  message.append(avatar, body);

  $("messages").appendChild(message);

  $("messages").scrollTop =
    $("messages").scrollHeight;
}

/* =========================================
   TEXT FORMATTING
========================================= */

function formatText(before, after) {
  const input = $("prompt");

  const start = input.selectionStart;
  const end = input.selectionEnd;

  const selected = input.value.slice(start, end);

  input.value =
    input.value.slice(0, start) +
    before +
    selected +
    after +
    input.value.slice(end);

  input.focus();

  input.selectionStart = start + before.length;

  input.selectionEnd =
    start + before.length + selected.length;
}

function handleEnter(event) {
  if (
    event.key === "Enter" &&
    !event.shiftKey
  ) {
    event.preventDefault();
    sendMessage();
  }
}

/* =========================================
   GEMINI MODEL LOADING
========================================= */

async function loadModels() {
  const status = $("modelStatus");
  const selectedBeforeRefresh = currentChat()?.model || $("model").value || "";

  // The dropdown is already populated from FALLBACK_GEMINI_MODELS.
  // Refresh metadata quietly in the background without blocking chat use.
  status.textContent = "Gemini profiles ready. Syncing...";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch("/api/models", {
      method: "GET",
      cache: "no-store",
      headers: { "Accept": "application/json" },
      signal: controller.signal
    });

    const data = await response.json();
    if (!response.ok || data.success !== true) {
      throw new Error(data.error || "Could not sync Gemini profiles.");
    }

    const models = data.groups?.Gemini;
    if (!Array.isArray(models) || models.length === 0) {
      throw new Error("The API returned no Gemini profiles.");
    }

    groups = { ...data.groups, Gemini: models };
    updateModels(selectedBeforeRefresh);
    status.textContent = models.length + " Gemini profiles ready";
  } catch (error) {
    console.warn("Gemini profile sync skipped; using built-in list:", error);
    if (!groups.Gemini?.length) groups.Gemini = FALLBACK_GEMINI_MODELS;
    updateModels(selectedBeforeRefresh);
    status.textContent = "11 Gemini profiles ready";
  } finally {
    clearTimeout(timeout);
  }
}

function updateModels(preferredModel = "") {
  const modelSelect = $("model");

  const models = Array.isArray(groups.Gemini)
    ? groups.Gemini
    : [];

  modelSelect.innerHTML = "";

  if (models.length === 0) {
    modelSelect.add(
      new Option("No Gemini models available", "")
    );

    return;
  }

  models.forEach(model => {
    modelSelect.add(
      new Option(model.name, model.id)
    );
  });

  const validPreferred = models.some(
    model => model.id === preferredModel
  );

  modelSelect.value = validPreferred
    ? preferredModel
    : models[0].id;

  const chat = currentChat();

  if (chat) {
    chat.provider = "Gemini";
    chat.model = modelSelect.value;

    saveChats();
  }
}

function providerChanged() {
  const provider = $("provider").value;

  localStorage.setItem(
    "ai_service_provider",
    provider
  );

  if (provider === "Gemini") {
    const chat = currentChat();

    if (groups.Gemini?.length) {
      updateModels(chat?.model || "");
    }
  }

  updateProviderView();
}

function updateProviderView() {
  const isEncyclopedia =
    $("provider").value === "Encyclopedia AI";

  $("modelLabel").style.display =
    isEncyclopedia ? "none" : "block";

  $("model").style.display =
    isEncyclopedia ? "none" : "block";

  $("modelStatus").style.display =
    isEncyclopedia ? "none" : "block";

  $("messages").style.display =
    isEncyclopedia ? "none" : "block";

  $("composerArea").style.display =
    isEncyclopedia ? "none" : "block";

  $("encyclopediaPanel").classList.toggle(
    "active",
    isEncyclopedia
  );

  $("chatTitle").textContent =
    isEncyclopedia
      ? "Encyclopedia AI"
      : (currentChat()?.title || "New Chat");
}

$("model").addEventListener("change", () => {
  const chat = currentChat();

  if (chat) {
    chat.provider = "Gemini";
    chat.model = $("model").value;

    saveChats();
  }
});

/* =========================================
   FILE UPLOADS
========================================= */

async function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);

    reader.onerror = () => {
      reject(
        new Error("Could not read " + file.name)
      );
    };

    reader.readAsDataURL(file);
  });
}

function handleFiles(event) {
  const incoming = Array.from(
    event.target.files || []
  );

  selectedFiles.push(...incoming);

  renderAttachments();

  event.target.value = "";
}

function renderAttachments() {
  $("attachments").innerHTML = "";

  selectedFiles.forEach((file, index) => {
    const item = document.createElement("div");

    item.className = "attachment";

    const name = document.createElement("span");

    name.textContent =
      file.name +
      " (" +
      (file.size / 1024).toFixed(1) +
      " KB)";

    const remove = document.createElement("button");

    remove.textContent = "×";
    remove.title = "Remove attachment";

    remove.onclick = () => {
      selectedFiles.splice(index, 1);
      renderAttachments();
    };

    item.append(name, remove);

    $("attachments").appendChild(item);
  });
}

/* =========================================
   DOCUMENT EXTRACTION
========================================= */

async function extractDocument(file) {
  const dataURL = await fileToDataURL(file);

  const base64 = dataURL.split(",")[1];

  if (!base64) {
    throw new Error(
      "Could not encode " + file.name
    );
  }

  if (base64.length > 3500000) {
    throw new Error(
      file.name +
      " is too large. Try a smaller file."
    );
  }

  const response = await fetch(
    "/api/extract",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        files: [{
          name: file.name,
          data: base64
        }]
      })
    }
  );

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(
      data.error || "Could not extract " + file.name
    );
  }

  const result = data.files?.[0];

  if (!result?.success) {
    throw new Error(
      result?.error || "Could not read " + file.name
    );
  }

  return result.text || "";
}

/* =========================================
   SEND MESSAGE
========================================= */

async function sendMessage() {
  if (busy) return;

  const text = $("prompt").value.trim();

  if (!text && !selectedFiles.length) return;

  if ($("provider").value === "Encyclopedia AI") {
    updateProviderView();
    return;
  }

  const model = $("model").value;

  if (!model) {
    alert("Please select a Gemini model.");
    return;
  }

  const chat = currentChat();

  if (!chat) return;

  busy = true;

  $("sendButton").disabled = true;
  $("sendButton").textContent = "Preparing...";

  let loading = null;

  try {
    const parts = [];

    if (text) {
      parts.push({
        type: "text",
        text
      });
    }

    for (const file of selectedFiles) {
      const type = file.type || "application/octet-stream";

      const extension = file.name
        .split(".")
        .pop()
        .toLowerCase();

      if (type.startsWith("image/")) {
        const allowed = [
          "image/png",
          "image/jpeg",
          "image/webp",
          "image/gif"
        ];

        if (!allowed.includes(type)) {
          parts.push({
            type: "text",
            text:
              "Image " +
              file.name +
              " has an unsupported format."
          });

          continue;
        }

        const dataURL = await fileToDataURL(file);

        parts.push({
          type: "text",
          text: "Attached image: " + file.name
        });

        parts.push({
          type: "image_url",
          image_url: {
            url: dataURL
          }
        });

      } else if (
        type.startsWith("text/") ||
        /\.(txt|md|csv|json|js|jsx|ts|tsx|html|css|xml|yaml|yml|py|java|c|cpp|sql|log|sh)$/i.test(file.name)
      ) {
        const contents = await file.text();

        parts.push({
          type: "text",
          text:
            "\n\nATTACHED FILE: " +
            file.name +
            "\nCONTENTS:\n" +
            contents
        });

      } else if (
        ["pdf", "docx", "xlsx", "xls", "pptx"].includes(extension)
      ) {
        $("sendButton").textContent = "Reading files...";

        try {
          const contents = await extractDocument(file);

          if (!contents.trim()) {
            throw new Error(
              "No readable text was found."
            );
          }

          parts.push({
            type: "text",
            text:
              "\n\nATTACHED FILE: " +
              file.name +
              "\nEXTRACTED CONTENTS:\n" +
              contents
          });

        } catch (error) {
          parts.push({
            type: "text",
            text:
              "\n\nCould not read " +
              file.name +
              ". Reason: " +
              error.message
          });
        }

      } else {
        parts.push({
          type: "text",
          text:
            "\n\nThe attached file " +
            file.name +
            " (" +
            type +
            ") is not supported for extraction."
        });
      }
    }

    const displayText =
      text ||
      "Attached " + selectedFiles.length + " file(s).";

    if (chat.messages.length === 0) {
      chat.title = displayText.slice(0, 35);
    }

    chat.provider = "Gemini";
    chat.model = model;

    const userMessage = {
      role: "user",
      content:
        parts.length === 1 && parts[0].type === "text"
          ? parts[0].text
          : parts
    };

    chat.messages.push(userMessage);

    addMessage("user", displayText);

    $("prompt").value = "";

    selectedFiles = [];
    renderAttachments();

    saveChats();
    renderHistory();

    loading = document.createElement("div");

    loading.className = "message";

    loading.innerHTML =
      '<div class="avatar">AI</div>' +
      '<div class="content">Thinking...</div>';

    $("messages").appendChild(loading);

    $("sendButton").textContent = "Thinking...";

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "text/event-stream, application/json"
      },
      body: JSON.stringify({
        provider: "Gemini",
        model,
        messages: chat.messages
      })
    });

    const contentType =
      response.headers.get("content-type") || "";

    if (!response.ok || contentType.includes("application/json")) {
      const errorData = await response.json().catch(() => ({}));

      throw new Error(
        errorData.error || "The request failed."
      );
    }

    if (!response.body || !response.body.getReader) {
      throw new Error(
        "Your browser could not read the streaming response."
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = "";
    let streamedReply = "";

    const assistantMessage = document.createElement("div");
    assistantMessage.className = "message assistant";

    const assistantAvatar = document.createElement("div");
    assistantAvatar.className = "avatar";
    assistantAvatar.textContent = "AI";

    const assistantBody = document.createElement("div");
    assistantBody.className = "content";
    assistantBody.textContent = "";

    assistantMessage.append(
      assistantAvatar,
      assistantBody
    );

    loading.replaceWith(assistantMessage);
    loading = assistantMessage;

    function processSSEBlock(block) {
      const dataLines = block.split("\n")
        .filter(line => line.startsWith("data:"))
        .map(line => line.slice(5).trim());

      if (!dataLines.length) return;

      const payload = dataLines.join("\n");

      if (payload === "[DONE]") return;

      let eventData;

      try {
        eventData = JSON.parse(payload);
      } catch {
        return;
      }

      if (eventData.error) {
        throw new Error(
          eventData.error.message ||
          "Gemini streaming error."
        );
      }

      const delta = (
        eventData.candidates?.[0]?.content?.parts || []
      )
        .map(part => part.text || "")
        .join("");

      if (delta) {
        streamedReply += delta;

        assistantBody.innerHTML =
          renderMarkdown(streamedReply);

        $("messages").scrollTop =
          $("messages").scrollHeight;
      }
    }

    while (true) {
      const { value, done } = await reader.read();

      if (done) break;

      buffer += decoder.decode(
        value,
        { stream: true }
      );

      const blocks = buffer.split(/\r?\n\r?\n/);

      buffer = blocks.pop() || "";

      for (const block of blocks) {
        processSSEBlock(block);
      }
    }

    buffer += decoder.decode();

    if (buffer.trim()) {
      processSSEBlock(buffer);
    }

    if (!streamedReply.trim()) {
      throw new Error(
        "Gemini returned an empty response."
      );
    }

    chat.messages.push({
      role: "assistant",
      content: streamedReply
    });

    saveChats();

  } catch (error) {
    if (loading) loading.remove();

    console.error("Message error:", error);

    addMessage(
      "assistant",
      "**Error:** " + error.message
    );

  } finally {
    busy = false;

    $("sendButton").disabled = false;
    $("sendButton").textContent = "Send ↑";
  }
}

/* =========================================
   STARTUP
========================================= */

// Restore chats first, then refresh model metadata in the background.
// The built-in model list is already available immediately.

loadChats();
loadModels();

</script>

</body>
</html>

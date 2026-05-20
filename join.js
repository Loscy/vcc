const githubFeatureRequestUrl = "https://github.com/loscy/vcc/discussions/new";

const els = {
  form: document.querySelector("#join-form"),
  output: document.querySelector("#json-output"),
  copy: document.querySelector("#copy-json"),
  submit: document.querySelector("#submit-issue"),
  name: document.querySelector("#project-name"),
  url: document.querySelector("#project-url"),
  description: document.querySelector("#project-description"),
  language: document.querySelector("#project-language"),
  level: document.querySelector("#vcc-level"),
  levelHelp: document.querySelector("#level-help"),
  levelDialog: document.querySelector("#level-dialog"),
  tools: document.querySelector("#ai-tools"),
  addTool: document.querySelector("#add-tool"),
};

let nextToolId = 1;
let nextModelId = 1;
let nextSkillId = 1;

function clean(value) {
  return String(value || "").trim();
}

function valueOf(root, selector) {
  return clean(root.querySelector(selector)?.value);
}

function normalizeUrl(value) {
  const url = clean(value);
  if (!url || /^[a-z][a-z0-9+.-]*:\/\//i.test(url)) return url;

  try {
    const candidate = new URL(`https://${url}`);
    if (
      candidate.hostname === "localhost" ||
      candidate.hostname.includes(".") ||
      /^\d{1,3}(?:\.\d{1,3}){3}$/.test(candidate.hostname)
    ) {
      return `https://${url}`;
    }
  } catch {
    return url;
  }

  if (/^localhost(?::\d+)?(?:[/?#].*)?$/i.test(url)) {
    return `https://${url}`;
  }

  return url;
}

function normalizeUrlInputs() {
  els.url.value = normalizeUrl(els.url.value);
  for (const urlInput of els.tools.querySelectorAll("[data-skill-url]")) {
    urlInput.value = normalizeUrl(urlInput.value);
  }
}

function buildEntry() {
  const entry = {
    name: clean(els.name.value) || "Project Name",
    description: clean(els.description.value) || "A short sentence about the project.",
    url: normalizeUrl(els.url.value) || "https://example.com/",
  };

  const language = clean(els.language.value);
  if (language) entry.language = language;

  entry.vcc = {
    level: els.level.value,
    status: "self-claimed",
  };

  entry.ai = readTools();

  return entry;
}

function validateEntry() {
  normalizeUrlInputs();
  if (!els.form.reportValidity()) return false;

  if (!readTools().length) {
    els.addTool.setCustomValidity("Add at least one tool with one model.");
    els.addTool.reportValidity();
    els.addTool.setCustomValidity("");
    return false;
  }

  return true;
}

function readTools() {
  return [...els.tools.querySelectorAll(".ai-tool-card")]
    .map((toolCard) => {
      const tool = valueOf(toolCard, "[data-tool-name]");
      const models = [...toolCard.querySelectorAll(".ai-model-card")]
        .map((modelCard) => {
          const model = {
            model: valueOf(modelCard, "[data-model-name]"),
          };

          const prompt = valueOf(modelCard, "[data-model-prompt]");
          if (prompt) model.prompt = prompt;

          const skills = [...modelCard.querySelectorAll(".skill-row")]
            .map((skillRow) => {
              const name = valueOf(skillRow, "[data-skill-name]");
              const url = normalizeUrl(valueOf(skillRow, "[data-skill-url]"));
              if (!name) return null;
              return url ? { name, url } : { name };
            })
            .filter(Boolean);

          if (skills.length) model.skills = skills;
          return model.model ? model : null;
        })
        .filter(Boolean);

      return tool && models.length ? { tool, models } : null;
    })
    .filter(Boolean);
}

function field(label, input) {
  const wrapper = document.createElement("label");
  wrapper.className = "field";
  const text = document.createElement("span");
  text.innerHTML = label;
  wrapper.append(text, input);
  return wrapper;
}

function input(attrs = {}) {
  const node = document.createElement("input");
  Object.assign(node, attrs);
  setDataset(node, attrs.data || attrs.dataset);
  return node;
}

function textarea(attrs = {}) {
  const node = document.createElement("textarea");
  Object.assign(node, attrs);
  setDataset(node, attrs.data || attrs.dataset);
  return node;
}

function setDataset(node, data) {
  if (!data) return;
  for (const [key, value] of Object.entries(data)) node.dataset[key] = value;
}

function createSkillRow() {
  const row = document.createElement("div");
  row.className = "skill-row";
  row.dataset.skillId = String(nextSkillId++);

  row.append(
    field("Skill name", input({ type: "text", placeholder: "pixel-ui", data: { skillName: "" } })),
    field("Skill URL", input({ type: "url", placeholder: "https://example.com/skill", data: { skillUrl: "" } })),
  );

  const remove = document.createElement("button");
  remove.className = "remove-row";
  remove.type = "button";
  remove.textContent = "Remove";
  remove.addEventListener("click", () => {
    row.remove();
    render();
  });
  row.append(remove);

  return row;
}

function createModelCard() {
  const card = document.createElement("div");
  card.className = "ai-model-card";
  card.dataset.modelId = String(nextModelId++);

  const head = document.createElement("div");
  head.className = "nested-head";
  const title = document.createElement("h4");
  title.textContent = "Model";
  const remove = document.createElement("button");
  remove.className = "remove-row";
  remove.type = "button";
  remove.textContent = "Remove model";
  remove.addEventListener("click", () => {
    card.remove();
    render();
  });
  head.append(title, remove);

  const modelInput = input({ type: "text", placeholder: "GPT-5.5", required: true });
  modelInput.dataset.modelName = "";
  const promptInput = textarea({ rows: 5, placeholder: "The main prompt or direction used for this model." });
  promptInput.dataset.modelPrompt = "";

  const skills = document.createElement("div");
  skills.className = "skill-list-editor";
  const addSkill = document.createElement("button");
  addSkill.className = "add-row";
  addSkill.type = "button";
  addSkill.textContent = "Add skill";
  addSkill.addEventListener("click", () => {
    skills.append(createSkillRow());
    render();
  });

  card.append(
    head,
    field('Model <em aria-label="required">*</em>', modelInput),
    field("Core prompt", promptInput),
    skills,
    addSkill,
  );

  return card;
}

function createToolCard() {
  const card = document.createElement("div");
  card.className = "ai-tool-card";
  card.dataset.toolId = String(nextToolId++);

  const head = document.createElement("div");
  head.className = "nested-head";
  const title = document.createElement("h3");
  title.textContent = "Tool";
  const remove = document.createElement("button");
  remove.className = "remove-row";
  remove.dataset.removeTool = "";
  remove.type = "button";
  remove.textContent = "Remove tool";
  remove.addEventListener("click", () => {
    if (remove.disabled) return;
    card.remove();
    render();
  });
  head.append(title, remove);

  const toolInput = input({ type: "text", placeholder: "Codex", required: true });
  toolInput.dataset.toolName = "";

  const models = document.createElement("div");
  models.className = "ai-models";
  models.append(createModelCard());

  const addModel = document.createElement("button");
  addModel.className = "add-row";
  addModel.type = "button";
  addModel.textContent = "Add model";
  addModel.addEventListener("click", () => {
    models.append(createModelCard());
    render();
  });

  card.append(head, field('Tool <em aria-label="required">*</em>', toolInput), models, addModel);
  return card;
}

function updateToolRemoveState() {
  const toolCards = [...els.tools.querySelectorAll(".ai-tool-card")];
  for (const toolCard of toolCards) {
    const remove = toolCard.querySelector("[data-remove-tool]");
    if (remove) remove.disabled = toolCards.length <= 1;
  }
}

function render() {
  updateToolRemoveState();
  els.output.textContent = `${JSON.stringify(buildEntry(), null, 2)}\n`;
}

for (const input of els.form.elements) {
  input.addEventListener("input", render);
  input.addEventListener("change", render);
}

els.form.addEventListener("input", render);
els.form.addEventListener("change", render);

els.addTool.addEventListener("click", () => {
  els.tools.append(createToolCard());
  render();
});

els.levelHelp.addEventListener("click", () => {
  if (typeof els.levelDialog.showModal === "function") {
    els.levelDialog.showModal();
  }
});

els.copy.addEventListener("click", async () => {
  if (!validateEntry()) return;

  try {
    await navigator.clipboard.writeText(els.output.textContent);
    els.copy.textContent = "Copied";
  } catch {
    els.copy.textContent = "Copy failed";
  }
});

els.submit.addEventListener("click", () => {
  if (!validateEntry()) return;

  const body = [
    "Feature request: please add this project to Vibe Code Club.",
    "",
    "```json",
    els.output.textContent.trim(),
    "```",
  ].join("\n");

  const url = new URL(githubFeatureRequestUrl);
  url.searchParams.set("category", "feature-requests");
  url.searchParams.set("title", `Add ${buildEntry().name}`);
  url.searchParams.set("body", body);
  window.open(url.toString(), "_blank", "noopener");
});

els.tools.append(createToolCard());
render();

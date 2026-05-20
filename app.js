const state = {
  projects: [],
  query: "",
  level: "",
  status: "",
};

const els = {
  search: document.querySelector("#search"),
  projects: document.querySelector("#projects"),
  count: document.querySelector("#count"),
  empty: document.querySelector("#empty"),
  clear: document.querySelector("#clear"),
  filterGroups: document.querySelectorAll("[data-filter-group]"),
  badgePreview: document.querySelector("#badge-preview"),
  badgeCode: document.querySelector("#badge-code"),
  badgeDomain: document.querySelector("#badge-domain"),
  promptDialog: document.querySelector("#prompt-dialog"),
  promptContent: document.querySelector("#prompt-content"),
};

const normalize = (value) => String(value || "").trim().toLowerCase();
const slug = (value) => normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const levelText = {
  "VCC-A": "AI assisted",
  "VCC-V": "vibe coded",
  "VCC-Z": "zero hand code",
};

const statusText = {
  "self-claimed": "self-claimed",
  discovered: "AI discovered",
};

function displayUrl(value) {
  try {
    const url = new URL(value);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}

function promptSummary(items) {
  if (!Array.isArray(items)) return "";
  return items
    .flatMap((item) => item.models || [])
    .map((model) => model.prompt)
    .filter(Boolean)
    .join("\n\n");
}

function hasAiDetails(items) {
  if (!Array.isArray(items)) return false;
  return items.some((item) => item.tool || (Array.isArray(item.models) && item.models.length));
}

function aiSearchText(items) {
  if (!Array.isArray(items)) return [];
  return items.flatMap((item) => [
    item.tool,
    ...(item.models || []).flatMap((model) => [
      model.model,
      model.prompt,
      ...(model.skills || []).flatMap((skill) => [skill.name, skill.url]),
    ]),
  ]);
}

function renderAiDetails(items) {
  els.promptContent.replaceChildren();
  if (!Array.isArray(items) || items.length === 0) return;

  for (const item of items) {
    const section = document.createElement("section");
    section.className = "ai-detail";

    const title = document.createElement("h3");
    title.textContent = item.tool || "Unknown tool";
    section.append(title);

    for (const model of item.models || []) {
      const modelBlock = document.createElement("div");
      modelBlock.className = "ai-model";

      const modelName = document.createElement("p");
      modelName.className = "ai-model-name";
      modelName.textContent = model.model;
      modelBlock.append(modelName);

      if (model.prompt) {
        const promptHeader = document.createElement("div");
        promptHeader.className = "prompt-row-header";

        const promptLabel = document.createElement("span");
        promptLabel.textContent = "Prompt";

        const copy = document.createElement("button");
        copy.className = "copy-prompt";
        copy.type = "button";
        copy.textContent = "Copy";
        copy.addEventListener("click", async () => {
          try {
            await navigator.clipboard.writeText(model.prompt);
            copy.textContent = "Copied";
          } catch {
            copy.textContent = "Copy failed";
          }
        });

        promptHeader.append(promptLabel, copy);
        modelBlock.append(promptHeader);

        const prompt = document.createElement("pre");
        const code = document.createElement("code");
        code.textContent = model.prompt;
        prompt.append(code);
        modelBlock.append(prompt);
      }

      if (Array.isArray(model.skills) && model.skills.length) {
        const skills = document.createElement("div");
        skills.className = "skill-list";

        for (const skill of model.skills) {
          const node = skill.url ? document.createElement("a") : document.createElement("span");
          node.className = "skill-link";
          node.textContent = skill.name;
          if (skill.url) {
            node.href = skill.url;
            node.target = "_blank";
            node.rel = "noopener";
          }
          skills.append(node);
        }

        modelBlock.append(skills);
      }

      section.append(modelBlock);
    }

    els.promptContent.append(section);
  }
}

function initialQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get("q") || params.get("domain") || "";
}

function cleanDomain(value) {
  return String(value || "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/.*$/, "");
}

async function loadProjects() {
  const response = await fetch("projects/index.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to load projects/index.json (${response.status})`);
  }
  state.projects = await response.json();
  state.projects.sort((a, b) => a.name.localeCompare(b.name));
}

function filteredProjects() {
  const query = normalize(state.query);

  return state.projects.filter((project) => {
    const haystack = normalize([
      project.name,
      project.url,
      project.description,
      project.language,
      project.vcc?.level,
      project.vcc?.status,
      ...aiSearchText(project.ai),
      promptSummary(project.ai),
    ].join(" "));

    const matchesQuery = !query || haystack.includes(query);
    const matchesLevel = !state.level || project.vcc?.level === state.level;
    const matchesStatus = !state.status || project.vcc?.status === state.status;

    return matchesQuery && matchesLevel && matchesStatus;
  });
}

function renderFilterButtons() {
  for (const group of els.filterGroups) {
    const key = group.dataset.filterGroup;
    for (const button of group.querySelectorAll("button")) {
      button.setAttribute("aria-pressed", String((state[key] || "") === button.dataset.filterValue));
    }
  }
}

function renderProjects() {
  const projects = filteredProjects();
  els.projects.replaceChildren();

  for (const project of projects) {
    const card = document.createElement("article");
    card.className = "project-card";

    const title = document.createElement("h2");
    const link = document.createElement("a");
    link.href = project.url;
    link.rel = "noreferrer";
    link.textContent = project.name;
    title.append(link);

    const titleRow = document.createElement("div");
    titleRow.className = "project-title-row";
    titleRow.append(title);

    const badges = document.createElement("div");
    badges.className = "cert-badges";

    const level = document.createElement("span");
    level.className = `cert-badge cert-level-${slug(project.vcc?.level)}`;
    level.textContent = project.vcc?.level || "VCC";
    level.title = project.vcc?.level ? levelText[project.vcc.level] : "";
    badges.append(level);

    const status = document.createElement("span");
    status.className = `cert-badge cert-status cert-status-${slug(project.vcc?.status)}`;
    status.textContent = statusText[project.vcc?.status] || project.vcc?.status || "unknown";
    badges.append(status);
    titleRow.append(badges);

    const url = document.createElement("a");
    url.className = "project-url";
    url.href = project.url;
    url.rel = "noreferrer";
    url.textContent = displayUrl(project.url);

    const heading = document.createElement("div");
    heading.className = "project-heading";
    heading.append(titleRow, url);

    const actionStack = document.createElement("div");
    actionStack.className = "card-actions";

    const aiButton = document.createElement("button");
    aiButton.className = "ai-button";
    aiButton.type = "button";
    aiButton.textContent = "prompt";
    aiButton.disabled = !hasAiDetails(project.ai);
    aiButton.addEventListener("click", () => {
      openAiDetails(project.name, project.ai);
    });
    actionStack.append(aiButton);

    const description = document.createElement("p");
    description.textContent = project.description;

    const meta = document.createElement("div");
    meta.className = "meta";
    const parts = [
      project.language,
      project.url ? "website" : "",
    ].filter(Boolean);

    const metaText = document.createElement("span");
    metaText.textContent = parts.join(" / ");
    meta.append(metaText);

    card.append(actionStack, heading, description);
    if (parts.length) card.append(meta);
    els.projects.append(card);
  }

  els.count.textContent = `${projects.length} of ${state.projects.length} projects`;
  els.empty.hidden = projects.length > 0;
}

function render() {
  renderFilterButtons();
  renderProjects();
}

function badgeValues() {
  return {
    domain: cleanDomain(els.badgeDomain.value),
  };
}

function renderBadge() {
  const badge = badgeValues();
  const href = badge.domain
    ? `https://vcc.loscy.com/?q=${encodeURIComponent(badge.domain)}`
    : "https://vcc.loscy.com/";

  els.badgePreview.href = href;
  els.badgeCode.textContent = `<a href="${href}" target="_blank" rel="noopener">\n  <img src="https://vcc.loscy.com/img/badge.png" alt="Vibe Code Club" width="88" height="31">\n</a>`;
}

function openAiDetails(_name, ai) {
  renderAiDetails(ai);
  if (typeof els.promptDialog.showModal === "function") {
    els.promptDialog.showModal();
  } else {
    els.promptDialog.setAttribute("open", "");
  }
}

els.search.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderProjects();
});

els.clear.addEventListener("click", () => {
  state.query = "";
  state.level = "";
  state.status = "";
  els.search.value = "";
  render();
});

for (const group of els.filterGroups) {
  const key = group.dataset.filterGroup;
  for (const button of group.querySelectorAll("button")) {
    button.addEventListener("click", () => {
      state[key] = button.dataset.filterValue;
      render();
    });
  }
}

for (const input of [els.badgeDomain]) {
  input.addEventListener("input", () => {
    renderBadge();
  });
  input.addEventListener("change", () => {
    renderBadge();
  });
}

state.query = initialQuery();
els.search.value = state.query;
els.badgeDomain.value = cleanDomain(state.query);
renderBadge();

loadProjects()
  .then(render)
  .catch((error) => {
    els.count.textContent = error.message;
  });

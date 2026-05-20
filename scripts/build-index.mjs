import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = new URL("..", import.meta.url);
const projectsDir = new URL("projects/", root);

const required = ["name", "url", "description", "vcc", "ai"];
const levels = new Set(["VCC-A", "VCC-V", "VCC-Z"]);
const statuses = new Set(["self-claimed", "discovered"]);

function fail(file, message) {
  throw new Error(`${file}: ${message}`);
}

function assertString(file, key, value) {
  if (typeof value !== "string" || value.trim() === "") {
    fail(file, `"${key}" must be a non-empty string`);
  }
}

function assertUrl(file, key, value) {
  if (value === undefined) return;
  assertString(file, key, value);
  const parsed = new URL(value);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    fail(file, `"${key}" must use http or https`);
  }
}

function assertProject(file, project) {
  if (!project || Array.isArray(project) || typeof project !== "object") {
    fail(file, "root value must be an object");
  }

  for (const key of required) {
    if (!(key in project)) fail(file, `missing required field "${key}"`);
  }

  assertString(file, "name", project.name);
  assertString(file, "description", project.description);

  assertUrl(file, "url", project.url);

  if (project.language !== undefined) assertString(file, "language", project.language);

  if (!project.vcc || Array.isArray(project.vcc) || typeof project.vcc !== "object") {
    fail(file, "\"vcc\" must be an object");
  }

  assertString(file, "vcc.level", project.vcc.level);
  if (!levels.has(project.vcc.level)) {
    fail(file, "\"vcc.level\" must be one of VCC-A, VCC-V, VCC-Z");
  }

  assertString(file, "vcc.status", project.vcc.status);
  if (!statuses.has(project.vcc.status)) {
    fail(file, "\"vcc.status\" must be one of self-claimed, discovered");
  }

  if (!Array.isArray(project.ai) || project.ai.length === 0) {
    fail(file, "\"ai\" must be a non-empty array");
  }

  for (const [index, item] of project.ai.entries()) {
    if (!item || Array.isArray(item) || typeof item !== "object") {
      fail(file, `"ai[${index}]" must be an object`);
    }

    assertString(file, `ai[${index}].tool`, item.tool);

    if (!Array.isArray(item.models) || item.models.length === 0) {
      fail(file, `"ai[${index}].models" must be a non-empty array`);
    }

    for (const [modelIndex, model] of item.models.entries()) {
      if (!model || Array.isArray(model) || typeof model !== "object") {
        fail(file, `"ai[${index}].models[${modelIndex}]" must be an object`);
      }

      assertString(file, `ai[${index}].models[${modelIndex}].model`, model.model);

      if (model.prompt !== undefined) {
        assertString(file, `ai[${index}].models[${modelIndex}].prompt`, model.prompt);
      }

      if (model.skills !== undefined) {
        if (!Array.isArray(model.skills)) {
          fail(file, `"ai[${index}].models[${modelIndex}].skills" must be an array`);
        }

        for (const [skillIndex, skill] of model.skills.entries()) {
          if (!skill || Array.isArray(skill) || typeof skill !== "object") {
            fail(file, `"ai[${index}].models[${modelIndex}].skills[${skillIndex}]" must be an object`);
          }

          assertString(file, `ai[${index}].models[${modelIndex}].skills[${skillIndex}].name`, skill.name);
          if (skill.url !== undefined) {
            assertUrl(file, `ai[${index}].models[${modelIndex}].skills[${skillIndex}].url`, skill.url);
          }
        }
      }
    }
  }
}

const files = (await readdir(projectsDir))
  .filter((file) => file.endsWith(".json") && file !== "index.json")
  .sort((a, b) => a.localeCompare(b));

const projects = [];
const seenUrls = new Set();

for (const file of files) {
  const text = await readFile(new URL(file, projectsDir), "utf8");
  let project;
  try {
    project = JSON.parse(text);
  } catch (error) {
    fail(file, `invalid JSON (${error.message})`);
  }

  assertProject(file, project);

  const primaryUrl = project.url.replace(/\/$/, "");
  if (seenUrls.has(primaryUrl)) fail(file, `duplicate url "${primaryUrl}"`);
  seenUrls.add(primaryUrl);

  projects.push(project);
}

projects.sort((a, b) => a.name.localeCompare(b.name));

await writeFile(
  new URL("index.json", projectsDir),
  `${JSON.stringify(projects, null, 2)}\n`,
);

console.log(`Built ${path.join("projects", "index.json")} with ${projects.length} projects.`);

# Vibe Code Club

Vibe Code Club (`vcc`) is a lightweight directory for projects built with
meaningful AI involvement.

The goal is to collect real apps, websites, tools, experiments, and prototypes
with clear AI involvement, from AI-assisted development to vibe-coded and
zero-hand-code projects.

The project is intentionally simple:

- Static HTML, CSS, and JavaScript.
- No frontend framework.
- One project per JSON file in `projects/`.
- `projects/index.json` is generated from those files.
- Easy to host on GitHub Pages, Netlify, Vercel, or any static server.

## Local development

```sh
npm run check
npm run serve
```

Then open <http://localhost:4173>.

## Add a project

You can generate a submission JSON from `join.html`, open a GitHub feature
request, or create a file manually.

Create a new JSON file in `projects/`, for example `projects/example.json`:

```json
{
  "name": "Example Project",
  "description": "A short sentence about what this AI-built project does.",
  "url": "https://example.com/",
  "language": "en",
  "vcc": {
    "level": "VCC-V",
    "status": "self-claimed"
  },
  "ai": [
    {
      "tool": "Codex",
      "models": [
        {
          "model": "GPT-5.5",
          "prompt": "Build a small personal website with a quiet pixel desktop interface.",
          "skills": [
            {
              "name": "pixel-ui",
              "url": "https://example.com/skill"
            }
          ]
        }
      ]
    }
  ]
}
```

Required fields:

- `name`
- `url`
- `description`
- `vcc.level`
- `vcc.status`
- `ai`
- `ai[].tool`
- `ai[].models`
- `ai[].models[].model`

Optional fields:

- `language`

Each model may also include an optional `prompt` field and optional `skills`.
Each skill requires `name`; `url` is optional and will render as a link when present.

## VCC Levels

- `VCC-A`: AI Assisted. AI helped significantly, but humans wrote much of the code.
- `VCC-V`: Vibe Coded. Primarily built through natural-language direction and AI implementation.
- `VCC-Z`: Zero Hand Code. AI handled coding, file creation, fixes, build, and deployment from zero to launch. Human work is limited to direction, review, approvals, and external setup such as domain DNS, accounts, secrets, payment, or hosting confirmations.

Status values:

- `self-claimed`: submitted or stated by the project owner.
- `discovered`: collected by AI-assisted discovery. If the listing is wrong,
  inaccurate, or unwanted, sorry for the trouble. Contact us or open an issue
  and it will be removed or adjusted promptly.

Run `npm run check` before opening a pull request.

## Badge

Listed projects can link back to VCC with the hosted badge image at
`https://vcc.loscy.com/img/badge.png`.

When an optional project domain is set, the generated link includes a search query like
`https://vcc.loscy.com/?q=example.com`, so visitors land on VCC with the search
box already filled.

```html
<a href="https://vcc.loscy.com/" target="_blank" rel="noopener">
  <img src="https://vcc.loscy.com/img/badge.png" alt="Vibe Code Club" width="88" height="31">
</a>
```

## What belongs here

Good entries are projects that were implemented by AI coding tools and are real
enough to inspect, run, or use. They can be websites, prototype apps, generated
games, developer tools, or experiments.

This is inspired by directory-style clubs like 512KB Club, but VCC is focused on
AI-written software rather than page weight.

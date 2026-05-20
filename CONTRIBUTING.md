# Contributing

Thanks for helping grow Vibe Code Club, a directory of projects built with
meaningful AI involvement.

## Add a project

1. Add one JSON file to `projects/`.
2. Keep the filename lowercase and descriptive, like `my-project.json`.
3. Use this format:

```json
{
  "name": "My Project",
  "description": "A clear one-sentence description.",
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
    },
    {
      "tool": "Claude Code",
      "models": [
        {
          "model": "Claude Sonnet 4.5"
        }
      ]
    }
  ]
}
```

4. Run `npm run check`.
5. Commit both your new JSON file and the generated `projects/index.json`.
6. Open a pull request.

## Review criteria

Entries should be real projects with enough substance to browse, inspect, run,
or use. The implementation should be AI-written. Human involvement is expected
for prompting, direction, verification, and release work.

Avoid submitting:

- Empty landing pages.
- Link lists without context.
- Projects mostly written by hand.
- Sites with illegal, hateful, or explicit content.
- Duplicates of existing entries.

## Data notes

Only `name`, `url`, `description`, `vcc.level`, `vcc.status`, `ai[].tool`, and
`ai[].models[].model` are required. `prompt` and `skills` are optional on each
model entry.

Use `VCC-A`, `VCC-V`, or `VCC-Z` for `vcc.level`. Use `self-claimed`,
`discovered` for `vcc.status`. `VCC-Z` means AI handled the
project from zero to launch, including coding, fixes, build, and deployment;
human work is limited to direction, review, approvals, and external setup such
as DNS, accounts, secrets, payment, or hosting confirmations.

Discovered entries are collected by AI-assisted discovery. If a listing is wrong,
inaccurate, or unwanted, sorry for the trouble. Contact us or open an issue and
it will be removed or adjusted promptly.

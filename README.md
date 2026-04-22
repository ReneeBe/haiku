# haiku.

AI haiku playground powered by Claude. Type a subject and watch the haiku take shape in real time, with syllable highlighting and drag-to-rearrange.

**[Live demo](https://reneebe.github.io/haiku/)** · Part of [50 Projects in 50 Days](https://reneebe.github.io/50projects)

## Features

- **Real-time generation**: haiku updates as you type
- **Syllable highlighting**: each syllable position gets a distinct color across all three lines, so you can see the 5-7-5 structure at a glance
- **Drag to rearrange**: grab any word and drag it within a line or between lines. Cross-line moves trigger a rebalance to restore 5-7-5
- **Onboarding guide**: first-time visitors get a quick walkthrough of the interactive features

## Auth

No API key needed. The app includes a daily visitor pool for free usage. [MagicLink](https://magiclink.reneebe.workers.dev/resume) tokens provide additional access (20 uses across all projects).

## Stack

- React + TypeScript + Vite
- [MagicLink](https://github.com/ReneeBe/magiclink) SDK for token-gated API access
- [@dnd-kit](https://dndkit.com/) for drag-and-drop word reordering
- [hyphen](https://github.com/ytiurin/hyphen) for syllable splitting + [syllable](https://github.com/words/syllable) for counting/validation
- Claude Haiku 4.5 via Anthropic Messages API
- GitHub Pages

## Development

```bash
npm install
npm run dev
```

To test MagicLink locally, append your token to the URL:

```
http://localhost:5173/haiku/?token=YOUR_TOKEN
```

## License

MIT

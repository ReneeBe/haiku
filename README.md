# haiku.

AI haiku playground powered by Claude. Type a subject and watch the haiku take shape in real time, with syllable highlighting and drag-to-rearrange.

**[Live demo](https://reneebe.github.io/haiku/)** · Part of [50 Projects in 50 Days](https://reneebe.github.io/50projects)

## Features

- **Real-time generation**: haiku updates as you type (with API key) or on demand (MagicLink demo mode)
- **Syllable highlighting**: each syllable position gets a distinct color across all three lines, so you can see the 5-7-5 structure at a glance
- **Drag to rearrange**: grab any word and drag it within a line or between lines. Cross-line moves trigger a rebalance to restore 5-7-5
- **Onboarding guide**: first-time visitors get a quick walkthrough of the interactive features

## Auth

Two ways to use it:

- **MagicLink**: visit with a [MagicLink token](https://magiclink.reneebe.workers.dev) for 5 free generations, no API key needed
- **API key**: enter your own Claude API key (stored in sessionStorage, cleared on tab close)

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

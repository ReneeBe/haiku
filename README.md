# haiku.

AI haiku generator powered by Claude. Type a subject and get a haiku back.

**[Live demo](https://reneebe.github.io/haiku/)** · Part of [50 Projects in 50 Days](https://reneebe.github.io/50projects)

## How it works

1. Describe a feeling, scene, or moment
2. Claude Haiku (claude-haiku-4-5) composes a 5-7-5 syllable haiku
3. Lines animate in one by one

## Auth

Two ways to use it:

- **MagicLink** — visit with a [MagicLink token](https://magiclink.reneebe.workers.dev) for 5 free generations, no API key needed
- **API key** — enter your own Claude API key (stored in sessionStorage, cleared on tab close)

## Stack

- React + TypeScript + Vite
- [MagicLink](https://github.com/ReneeBe/magiclink) SDK for token-gated API access
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

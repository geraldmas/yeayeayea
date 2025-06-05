# Yeayeayea

Yeayeayea is a web application for building and managing trading card game data. The project is written in **TypeScript** using **React** for the UI and a small **Express** server for authentication APIs.

## Prerequisites

- Node.js 18 or later
- npm

Environment variables are read from a `.env` file. Example configuration is provided in the repository. Adjust the Supabase keys and other values to match your setup.

## Installation

1. Clone the repository
2. Install dependencies

```bash
npm install
```

## Development

During development you can run the React front‑end and the API server together:

```bash
npm run dev
```

This starts the React dev server on port **3000** and the Express server on port **3001**.

If you only need the front‑end you can use `npm start`. To start only the API server, run `npm run server`.

## Building

Create an optimized production build with:

```bash
npm run build
```

The output is placed in the `build/` directory.

## Testing

Unit tests are written with Jest and ts‑jest. Run them with:

```bash
npm test
```

For continuous integration environments, use:

```bash
npm run test:ci
```

## License

This project is released under the MIT License. See [LICENSE](LICENSE) for details.



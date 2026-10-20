# FRAGILE

A minimalist interactive 3D artwork about endangered species. White triangular wireframe sculptures move gently against a black background, then break apart and reassemble as the next animal.

**[Open the live experience](https://koraitess-prog.github.io/fragile/)**

## Interact

- Drag with a mouse or one finger to rotate the sculpture.
- Click or tap the animal to transform it. Dragging does not trigger transformation.
- Press Enter or Space when the sculpture is focused to transform.

The cycle is **Black Rhinoceros → Hawksbill Sea Turtle → Tapanuli Orangutan → Chinese Pangolin → Philippine Eagle → Great Hammerhead → Sunda Tiger → Black Rhinoceros**. The eagle is posed in flight, with controlled wing strokes and quiet glides. The hammerhead swims with a lateral body wave, tail propulsion and restrained banking. The tiger holds a poised stance with breathing, alert head movements, weight shifts and tail balance.

Each animal uses an original connected **220-triangle / 112-vertex** mesh. At rest, shared vertices deform together. During the transition, persistent face fragments spread through a broad 3D volume before reconstructing the next species. There is no polygon surface-fill pass.

## Run locally

Node.js 24 is recommended.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:4174/ . To build and preview production files:

```sh
npm run build
npm run preview
```

Species can be opened directly with `?species=rhino`, `turtle`, `orangutan`, `pangolin`, or `eagle`.

## Validate

```sh
npm test
npm run test:framing
```

The checks cover all seven connected meshes, shared-vertex movement, transition endpoints, fragment correspondence, mouse/touch gesture handling, and camera safety across portrait and landscape views.

## Publish updates

Every push to `main` runs the **Deploy FRAGILE** GitHub Actions workflow. It installs dependencies, validates the collection, builds with the repository's Pages base path, and deploys `dist` to GitHub Pages. Failed validation blocks deployment.

The site has no API keys, backend, or required third-party runtime services. Fonts and geometry are bundled locally. Population figures are sourced estimates with explicit scope, not live counters; sources and conservation metadata are maintained in `src/animals.js`.

## Source and notices

The animal meshes are original stylized sculptures. Motion and silhouettes are artistic interpretations, not zoological scans or biomechanical simulations. Runtime code uses Three.js and Vite; typography is IBM Plex Mono. Dependency and font notices are retained in `THIRD_PARTY/`.

This repository contains the runnable project and portable development tools. Local reference footage, research captures, experiment archives and QA recordings are intentionally excluded.

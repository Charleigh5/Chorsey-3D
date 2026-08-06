# UEViewer Asset Bridge v0.1.0

A read-only wrapper for **UE Viewer / UModel** that inventories an authorized Unreal game directory, selects one package/object, exports or accepts one JSON `.gltf`, validates it, hashes the source and output evidence, and emits **one self-contained offline HTML evidence package**.

## Safety contract

- Operates only on a directory the operator owns or is authorized to inspect.
- Requires the exact acknowledgement `I_OWN_OR_AM_AUTHORIZED`.
- Never writes inside the authorized game directory.
- Refuses to overwrite an existing output.
- Skips symlinks and special files during package inventory.
- Re-hashes the selected source package and verifies size/mtime stability before completing.
- Uses a quarantined export directory when invoking UEViewer.
- Performs no injection, executable patching, anti-cheat bypass, online manipulation, or game-file replacement.
- Redacts absolute source paths unless `--include-source-paths` is deliberately supplied.

## Canonical output

The generated `.html` embeds:

- Package inventory and inventory digest
- Selected package metadata and SHA-256
- UEViewer invocation receipt or pre-exported-input receipt
- Structural glTF validation findings
- Mesh/material/texture counts
- glTF JSON, buffers, and referenced images/textures
- Read-only execution receipt
- Offline WebGL2 static-mesh viewer
- Canonical self-verification hash

No CDN, external script, runtime `fetch()`, or network resource is used.

## Requirements

- Node.js 20 or newer
- For real export mode: an authorized UEViewer/UModel executable compatible with the selected game
- UEViewer supports Unreal Engine 1–4; this bridge does not add Unreal Engine 5 or Frostbite parsing

## Deterministic fixture

```bash
cd tools/ueviewer-asset-bridge
npm run build:sample
npm test
```

Output:

```text
artifacts/sample-evidence.html
```

## Real UEViewer export

```bash
node src/bridge.mjs build \
  --game-dir "D:\AuthorizedUnrealGame" \
  --package "Content\Characters\Hero.upk" \
  --object "HeroMesh" \
  --umodel "C:\Tools\UEViewer\umodel.exe" \
  --output "D:\Evidence\hero-mesh-evidence.html" \
  --acknowledge-read-only I_OWN_OR_AM_AUTHORIZED
```

Optional UEViewer selector:

```text
--game-option=-game=<supported-game-id>
```

The wrapper invokes the official UEViewer command pattern using `-path`, `-export`, `-gltf`, and `-out` and passes the selected package/object. The export is staged outside the game directory.

## Pre-exported glTF mode

Use this for deterministic testing or when UEViewer export was performed separately:

```bash
node src/bridge.mjs build \
  --game-dir "D:\AuthorizedUnrealGame" \
  --package "Content\Characters\Hero.upk" \
  --object "HeroMesh" \
  --gltf "D:\Quarantine\HeroMesh.gltf" \
  --output "D:\Evidence\hero-mesh-evidence.html" \
  --acknowledge-read-only I_OWN_OR_AM_AUTHORIZED
```

## Validation boundary

The validator is an adversarial structural gate, not the official Khronos glTF Validator. It checks JSON glTF 2.x declarations, resource containment, buffer sizes, buffer views, accessors, mesh references, scene/node references, image references, and embedded payload limits. Production promotion should also run the official Khronos validator and inspect the result in Blender or another independent renderer.

The embedded browser viewer is intentionally bounded to static triangle meshes, POSITION/NORMAL attributes, indices, and base-color factors. It does not prove skeletal-animation fidelity, shader parity, Unreal material-graph reconstruction, collision, sockets, LOD survival, or engine re-import compatibility.

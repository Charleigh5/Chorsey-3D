# UEViewer Asset Bridge — Implementation Receipt v0.1.0

## Verdict

`PASS_WITH_REAL_UEVIEWER_AND_GAME_RUNTIME_BOUNDARY`

## Implemented

- Authorized-directory package inventory
- Selected package containment and extension gate
- Optional SHA-256 for all inventoried packages
- Selected-source SHA-256 and stability verification
- UEViewer command wrapper with quarantined output
- Existing `.gltf` fixture/pre-export mode
- Structural glTF 2.x validation
- Embedded resources and offline WebGL2 viewer
- Manifest and zero-source-write execution receipt
- Canonical self-hash and physical output hash
- Exact acknowledgement, no-overwrite, path-redaction, and output-location gates
- Dependency-free deterministic self-test
- GitHub Actions source-integrity, fixture-build, and browser-render proof

## Final GitHub verification

Verified source head:

```text
782ed14cd43f8b2719f0556ce2b817961bb283d5
```

| Gate | Result |
|---|---:|
| JavaScript syntax/source integrity | PASS |
| Deterministic evidence build | PASS |
| Self-test | PASS — 15 checks |
| Output file count | PASS — exactly one canonical HTML |
| Inventory | PASS — 1 fixture package |
| Geometry | PASS — 1 mesh, 1 primitive, 3 vertices, 3 indices |
| Runtime fetch/external asset scan | PASS — none |
| Source writes | PASS — none |
| Canonical self-hash recomputation | PASS |
| Invalid authorization acknowledgement | PASS — blocked |
| Chromium WebGL2 context | PASS |
| Embedded mesh render state | PASS — `RENDERED` |
| Browser dimensions | PASS — 1045 × 835 |
| Browser page errors | PASS — none |
| Browser console errors | PASS — none |
| External browser requests | PASS — zero |
| Browser evidence screenshot | PASS — captured |

## Evidence references

```text
Workflow run: 31073195947
Job: 92525279729
Artifact: ueviewer-asset-bridge-31073195947
Artifact ID: 8956423175
Artifact SHA-256: 4112014e579f3621cc1a6acaf3a623e04e6d940903c387610bd6ed22d889459e
Artifact retention through: 2026-08-20T05:08:06Z
```

The artifact contains:

- `sample-evidence.html`
- `browser-smoke.png`

Fixture evidence generated during the successful run:

```text
Canonical HTML SHA-256: c8c265d36e413b3326e3a0d492f7eec24ebc953335cb04e6c7b474832c6c381f
Physical file SHA-256: 9addb681299e3fd3427e3c6e043d0745376b89a29c2567d8e549fe047f1d13f4
Evidence bytes: 18161
```

These fixture hashes are execution-specific because generated timestamps are embedded in the evidence package.

## Defects found and corrected during QA

1. A large initial source upload was corrupted in transit. The bridge was decomposed into smaller modules and CI now runs `node --check` against every JavaScript source file.
2. A one-character test-file corruption was detected and corrected before promotion.
3. Pure headless Chromium did not expose WebGL2. The proof now runs headed Chromium under Xvfb with SwiftShader.
4. The browser proof exposed an invalid fragment-shader separator and an incorrect mesh collection reference. Both were corrected, and the final run reached `RENDERED` with no browser errors.

## Not yet claimed

- No commercial game directory was inspected.
- No real UEViewer binary was executed in this environment.
- No game-specific compatibility option was validated.
- No official Khronos validator was executed.
- No Blender/Unreal round trip was executed.
- No skeletal animation, socket, collision, LOD, or full material parity was verified.
- The deterministic fixture contains no texture image; the code path embeds referenced glTF images and buffers, but a real texture-bearing UEViewer export remains a promotion test.

## Promotion gate

Run one authorized local case with a pinned UEViewer binary and a legally inspectable UE1–4 package. Preserve the binary hash, exact redacted arguments, source package hash, generated evidence package, official Khronos validation, texture-bearing output, and an independent Blender or Unreal import receipt.

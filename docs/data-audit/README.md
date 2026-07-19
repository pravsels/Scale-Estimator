# Training-data audits

These documents record the evidence behind every default shown by Scale
Estimator. Each model has its own audit so its sources and arithmetic can be
checked independently:

- [MolmoAct2](molmoact2.md)
- [π0.5](pi05.md)
- [LingBot-VLA 2.0](lingbot-vla-2.md)

Totals compare heterogeneous proxies for unique, disclosed data—not exact
optimizer exposure. Sources with missing quantities or overlapping data remain
visible but are excluded.

Evidence labels:

- **Paper fact** — stated in the cited paper.
- **Official artifact** — read from a pinned author checkpoint or repository.
- **Derived** — arithmetic over cited facts.
- **Assumption** — a necessary, editable conversion choice not stated by the
  source.

## Shared conversion

For a temporal source:

```text
frames = disclosed frames
      or hours × 3,600 × assumed frames/second

patches/view = ceil((resolution ÷ patch size) ÷ spatial pooling)²
visual tokens/frame = patches/view × camera views

naive visual tokens = frames × visual tokens/frame
effective frames = sequences + (frames − sequences) × novelty
effective visual tokens = effective frames × visual tokens/frame

state/action tokens = frames × (state dimensions + action dimensions)
language tokens = sequences × assumed language tokens/sequence
```

The first frame of each sequence is retained in full; later frames receive the
editable novelty discount. State and action dimensions are proxies, not native
tokenizer outputs. Only sources marked **Included** affect the overview.

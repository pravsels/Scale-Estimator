# Scale Estimator

A tiny, single-file tool for asking a blunt question about robot policies (VLAs): **how scaled are they, really?**

The debate around "VLAs don't work" often skips the obvious: most of these models are trained on a rounding error of data compared to even a modest LLM. Scale Estimator makes that concrete. It plots a policy's **parameters vs. training tokens** on a log-log chart next to landmarks you already have intuition for — GPT-2, GPT-3, Chinchilla, Llama 2 — and marks the Chinchilla-optimal line so you can see how data-starved a model is for its size.

## The idea

Counting robot data in "tokens" is tricky, because a token isn't a token:

- In **text**, every word carries new information.
- In **video** at 30 fps, frame N+1 is almost a copy of frame N — barely anything changed.

So the tool shows two numbers:

- **Naive tokens** — count every frame in full. Overstates the data.
- **Effective tokens** — only count what's actually new frame to frame. The `novelty` slider is your estimate of that (text ≈ 100%, slow-moving video ≈ 2%).

State and actions are counted every control step (they really do change); the language instruction counts once per episode. Training compute uses the Chinchilla rule of thumb `C ≈ 6 · N · D · epochs`, compared against the ~3.1e23 FLOPs it took to train GPT-3.

## Usage

Open `index.html` in a browser. Everything is editable — resolution, patch size, camera views, control rate, dataset hours, params, epochs, novelty. Hover anywhere on the chart for a params/tokens read-off and how far that point sits from Chinchilla-optimal.

## Status

Currently seeded with **MolmoAct2** ([arXiv:2605.02881](https://arxiv.org/abs/2605.02881)). Only the 720 hours of bimanual data is from the paper; everything else (params, resolution, control rate, episode length, novelty, epochs) is a placeholder — swap in real values as you read the methods.

Reference: [Chinchilla (Hoffmann et al., 2022)](https://arxiv.org/abs/2203.15556).

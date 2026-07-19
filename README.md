# Scale Estimator

**[Live site → pravsels.github.io/Scale-Estimator](https://pravsels.github.io/Scale-Estimator/)**

A tool for visualizing one major question about robot models: **how scaled are they, really ?**

![Parameters vs. training tokens, robot models against seminal LLMs](assets/graph.svg?v=2a8ddd4)

It plots a model's **parameters vs. estimated training tokens** against some seminal LLMs (GPT-2, GPT-3, Chinchilla, Llama 2), with the Chinchilla-optimal line, so you can see how data-starved a model is for its size. The current audit covers MolmoAct2, π0.5, and LingBot-VLA 2.0.

Counting robot data in tokens is tricky: in text every word is new, but at 30 fps frame N+1 is nearly a copy of frame N. So it shows two numbers: **naive** (count every frame) and **effective** (only what's new, set by the `novelty` slider).

Exact sources, assumptions, arithmetic, and exclusions are indexed in [`docs/data-audit/`](docs/data-audit/README.md).

## Usage

Open `index.html` for the overview: every model plotted against the LLM landmarks. Click one to open its detail page (`model.html`), where you can edit the assumptions and see the numbers move. Hover the chart anywhere for a params/tokens read-off. Compute uses `C ≈ 6·N·D·epochs`.

Model values and source records live in `data.js`. The controls edit the primary quantified source as a what-if; other included sources retain their audited defaults.

## Adding a model

Each contribution must include the model record, an audit document, tests, and a regenerated overview image.

1. **Research primary sources.** Prefer a versioned paper PDF and pinned official checkpoint or repository revision. Record exact quotations, PDF pages/sections, URLs, disclosed quantities, and anything the authors do not disclose. Do not silently turn a control frequency into video FPS or infer missing dataset sizes.
2. **Add the model to `MODELS` in `data.js`.** Include:
   - `primarySourceId`, `auditDoc`, parameter count/unit, paper URL, estimate label, `parameterEvidence`, novelty, epochs, and `countEveryStep`.
   - A `sources` entry for every disclosed training source. Mark it `included` only when its quantity can be converted without double-counting; otherwise mark it `excluded` and explain why.
   - For included sources: quantity (`hours`, `frames`, or `clips`), visual preprocessing, control dimensions, evidence, assumptions, and whether the result is an estimate or lower bound.
   - For every evidence item: `kind`, `location`, stable `url`, and either a verbatim `quote` or clearly labelled `statement`.
3. **Write `docs/data-audit/<model-slug>.md`.** Explain the parameter count, each included source, exact conversion math, assumptions, and every excluded source. Link it from `docs/data-audit/README.md`.
4. **Update `tests/scale.test.js`.** Add the model to the expected model list and assertions for important model-specific derivations.
5. **Verify and regenerate artifacts:**

   ```sh
   node --test tests/*.test.js
   node build-graph.js
   ```

`index.html` and the model selector are generated from `MODELS`, so they do not need a manual entry. Before submitting, open the overview and new detail page locally and confirm the source cards, labels, links, and plotted point.

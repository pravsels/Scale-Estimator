# Scale Estimator

A single-file tool for one blunt question about robot policies (VLAs): **how scaled are they, really?**

It plots a policy's **parameters vs. training tokens** against LLMs you know — GPT-2, GPT-3, Chinchilla, Llama 2 — with the Chinchilla-optimal line, so you can see how data-starved a model is for its size.

Counting robot data in tokens is tricky: in text every word is new, but at 30 fps frame N+1 is nearly a copy of frame N. So it shows two numbers — **naive** (count every frame) and **effective** (only what's new, set by the `novelty` slider).

## Usage

Open `index.html`. Everything's editable in-page; hover the chart for a params/tokens read-off. Compute uses `C ≈ 6·N·D·epochs`.

Model values live in `data.js` — edit the numbers as you read a paper, or add another entry and it shows up in the dropdown.

# MolmoAct2 data audit

Primary paper: [MolmoAct2: Action Reasoning Models for Real-World
Deployment](https://arxiv.org/pdf/2605.02881v1).

Official checkpoint revision:
[`e432d85`](https://huggingface.co/allenai/MolmoAct2/tree/e432d85f6e039edca44afb93c262f3084ab72a9c).

See the [audit methodology and shared conversion](README.md).

## Model size and visual tokenizer

- **Official artifact:** the pinned checkpoint index field
  `metadata.total_size` corresponds to **5,485,309,424 parameters**. The paper
  does not state a total parameter count.
- **Paper fact, PDF p. 8, §4.1.2:** “Visual observations are encoded by the
  SigLIP2 ViT.” The same paragraph says: “for images, it pools each 2 × 2 patch
  window.”
- **Official artifact:** the pinned processor config uses a 378 × 378 image and
  patch size 14.
- **Derived:** `ceil((378 / 14) / 2)² = 196` visual tokens per view.

## Included robot sources

### MolmoAct2-BimanualYAM

- **Paper fact, PDF pp. 4–5, §3.1:** “In total, the dataset comprises 34.5k
  robot demonstrations totaling over 720 hours of robot data…”
- **Paper fact, PDF p. 12, §4.3.1:** the YAM recipe uses top, left-wrist, and
  right-wrist views at 30 Hz with a 30-step, one-second action chunk.
- **Official artifact:** pinned normalization metadata has 14 state and 14
  action values.
- **Included as a lower bound:** 720 hours, 34,500 sequences, 30 FPS, three
  views.
- **Derived:** `720 × 3,600 × 30 = 77,760,000` control frames and
  `77,760,000 × 196 × 3 = 45,722,880,000` naive visual tokens.
- **Assumptions:** the disclosed control rate is used as recorded FPS; one
  demonstration is one sequence; scalar dimensions proxy state/action tokens;
  language is 16 tokens per demonstration; novelty defaults to 5%.

### SO-100/101

- **Paper fact, PDF p. 5, §3.2:** “This corpus contains 38,059 robot
  demonstration episodes, 19.8M frames, and approximately 184 hours of
  interaction data.”
- **Paper fact, PDF p. 12, §4.3.1:** the recipe runs at 30 Hz with a 30-step
  chunk; camera count and layout vary.
- **Official artifact:** pinned normalization metadata has six state and six
  action values.
- **Included as an estimate:** the disclosed 19.8M frames and 38,059 episodes.
- **Assumptions:** one view is used as a conservative common denominator;
  378/14 inputs and 2×2 pooling follow the released model processor; scalar
  dimensions proxy tokens; language is 16 tokens/episode; novelty is 5%.

### DROID subset

- **Paper fact, PDF p. 6, §3.3:** “The resulting subset… contains 74,604 valid
  episodes comprising a total of 17,758,044 frames.”
- **Paper fact, PDF p. 12, §4.3.1:** DROID provides two exterior and one wrist
  camera; training uses one exterior view plus the wrist view at 15 Hz.
- **Official artifact:** pinned normalization metadata has eight state and
  eight action values.
- **Included as an estimate:** 17,758,044 disclosed frames, 74,604 episodes,
  and two training views.
- **Derived:** if every frame is a 15 Hz control frame,
  `17,758,044 / 15 / 3,600 = 328.85 hours`.
- **Assumptions:** scalar dimensions proxy tokens; language is 16
  tokens/episode; novelty is 5%.

## Disclosed but excluded sources

- **Academic robot pool — excluded, quantity unknown.** PDF p. 6, §3.4:
  “This pool consists of a targeted subset of the Open X-Embodiment… including
  BC-Z, BridgeData V2, and RT-1, together with MolmoAct Dataset…” No subset
  size is given.
- **Molmo2/Molmo2-ER/Tulu corpus — excluded, token length unknown.** PDF p. 3,
  Table 1 reports approximately 12.51M examples: 8.25M Molmo2, 3.26M
  Molmo2-ER, and 980K Tulu NLP. An average consumed token count per example is
  not reported, so examples cannot honestly be added to patch-token totals.
- **OpenFAST corpus — excluded to avoid overlap.** PDF p. 8, §4.1.1:
  “We subsample one million action sequences across five embodiments…” and
  “Each training sequence corresponds to one second of robot motion.” These
  samples come from robot datasets already represented above; sampling stride
  and overlap are not disclosed.
- **Training exposure — shown as context, not added to unique data.** PDF p. 9,
  §4.1.2: “We allocate 10% of sampling to multimodal data and 90% to robot
  trajectories.” The same page states 200K steps, maximum sequence length
  4,200, and global batch 128. PDF p. 11 states 100K post-training updates,
  batch 128, with robot sequences of 2,100 and VLM sequences of 4,200. Maximum
  sequence lengths are not actual per-example token counts.

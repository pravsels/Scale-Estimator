# LingBot-VLA 2.0 data audit

Primary paper: [From Foundation to Application: Improving VLA Models in
Practice](https://arxiv.org/pdf/2607.06403v1).

Official checkpoint revision:
[`11c703b`](https://huggingface.co/robbyant/lingbot-vla-v2-6b/tree/11c703bf6a5c1f45b3b69168482da11fdbba53d7).

See the [audit methodology and shared conversion](README.md).

## Model size and visual tokenizer

- **Official artifact:** the pinned safetensors index reports
  `metadata.total_size = 25,503,630,044` bytes of F32 weights.
- **Derived:** `25,503,630,044 / 4 = 6,375,907,511` parameters.
- **Official artifact:** the pinned processor uses patch size 16, spatial merge
  size 2, and 224 × 224 repository dataset images.
- **Derived:** `(224 / 16)² = 196` raw patches and
  `196 / 2² = 49` merged visual tokens per view.

## Included pretraining sources

### Robot trajectories

- **Paper fact, PDF p. 1, Abstract:** “we revamp the data processing pipeline
  and curate around 60,000 hours of data for pretraining, including 50,000
  hours of robot trajectories spanning 20 robot configurations and 10,000
  hours of egocentric human videos.”
- **Paper fact, PDF p. 4, §3.1.1:** “We collect approximately 90,000 hours of
  data from 20 embodiments… yielding 50,000 hours of high-quality robotic
  data.”
- **Paper fact, PDF p. 5, Table 1:** policy frequency is 30 for 18
  configurations and 15 for two Galaxea configurations.
- **Paper fact, PDF p. 6, §3.1.3:** “we use a 55-dimensional canonical vector
  representation for both states and actions.”
- **Included as an estimate:** 50,000 hours at 30 FPS, three repository-default
  views, 55 state and 55 action scalar proxies.
- **Assumptions:** policy frequency is used as FPS because hours by embodiment
  are not given; three views generalize the released top/left-wrist/right-wrist
  layout; mean episode length is 60 seconds; language is 16 tokens/episode;
  novelty is 5%.
- **Derived:** `50,000 × 3,600 × 30 = 5,400,000,000` assumed robot frames and
  `49 × 3 = 147` merged visual tokens/frame.

### Egocentric human video

- **Paper fact, PDF p. 5, §3.1.2:** “We construct an egocentric human video
  pool of approximately 20,000 hours and retain around 10,000 hours of
  high-quality training data after filtering, reconstruction, standardization,
  and quality control.”
- **Paper fact, PDF p. 5, Table 1:** egocentric policy frequency is 30–60.
- **Included as an estimate:** 10,000 hours, one view, and the conservative
  lower endpoint of 30 FPS.
- **Assumptions:** policy frequency is used as video FPS; 224/16 preprocessing
  and 2×2 merge follow the released processor; mean clip length is 60 seconds;
  novelty is 5%.
- **Derived:** `10,000 × 3,600 × 30 = 1,080,000,000` assumed video frames and
  49 merged visual tokens/frame.

### DINO-Video teacher corpus

- **Paper fact, PDF p. 10, §4.2:** “We train DINO-Video on 5M video clips
  spanning Internet, egocentric, and robotic data, using video-adapted DINO and
  iBOT self-distillation objectives [40].” The paper adds: “For each sample, we
  uniformly sample 16 frames…”
- **Official artifact:** the pinned DINO config uses 256 × 256 input and patch
  size 16.
- **Included as a separately trained teacher corpus:** 5M clips × 16 frames.
- **Derived:** `5,000,000 × 16 = 80,000,000` sampled frame instances,
  `(256 / 16)² = 256` patch tokens/frame, and 20.48B naive patch-token
  instances for one pass.
- **Assumptions:** clips are sequence boundaries and use the shared 5% novelty
  default; DINO epochs and source mixture are unknown.

## Disclosed but excluded sources

- **Raw filtered-out pools — excluded.** The 90K robot and 20K egocentric raw
  hours contain the retained 50K and 10K corpora; adding them would
  double-count data that did not survive filtering.
- **LingBot-Depth corpus — quantity unknown.** The paper describes generated
  geometric targets but does not disclose its training-data volume.
- **Qwen3-VL upstream corpus — quantity unknown.** The released model uses a
  Qwen3-VL-4B-Instruct backbone, but the LingBot paper does not disclose its
  consumed upstream image/text/video volume.
- **Post-training data — quantity unknown.** The paper provides evaluation
  trials but no general post-training hours, episode count, epochs, or mixture
  weights for the released base model.

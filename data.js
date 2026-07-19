// Audited model defaults. Each included source contributes to the graph;
// excluded sources remain visible so missing quantities are never silent.
// See docs/data-audit/ for per-model source ledgers and conversion policy.

const MODELS = {
  "MolmoAct2": {
    primarySourceId: "yam",
    auditDoc: "docs/data-audit/molmoact2.md",
    params: 5.485309424, paramUnit: "1e9",
    novelty: 5, epochs: 1, countEveryStep: true,
    paper: "https://arxiv.org/abs/2605.02881",
    estimateKind: "partial lower-bound",
    parameterEvidence: {
      kind: "official artifact",
      location: "Pinned checkpoint index, metadata.total_size",
      url: "https://huggingface.co/allenai/MolmoAct2/blob/e432d85f6e039edca44afb93c262f3084ab72a9c/model.safetensors.index.json",
      statement: "Released checkpoint total: 5,485,309,424 parameters; the paper does not state an exact total."
    },
    sources: [
      {
        id: "yam", label: "BimanualYAM robot trajectories",
        status: "included", estimateKind: "lower-bound",
        quantity: {hours: 720, sequences: 34500},
        visual: {resolution: 378, patch: 14, pooling: 2, views: 3},
        control: {fps: 30, state: 14, action: 14, languagePerSequence: 16},
        evidence: [{
          kind: "paper fact", location: "PDF pp. 4–5, §3.1",
          url: "https://arxiv.org/pdf/2605.02881v1",
          quote: "In total, the dataset comprises 34.5k robot demonstrations totaling over 720 hours of robot data…"
        }, {
          kind: "paper fact", location: "PDF p. 12, §4.3.1",
          url: "https://arxiv.org/pdf/2605.02881v1",
          statement: "YAM uses top, left-wrist, and right-wrist views at 30 Hz with a 30-step, one-second action chunk."
        }],
        assumptions: [
          "The 30 Hz control rate is used as recorded FPS.",
          "Released 378/14 preprocessing and 2×2 image pooling apply.",
          "Scalar state/action dimensions proxy tokens; language is 16 tokens/demo."
        ]
      },
      {
        id: "so100", label: "SO-100/101 community corpus",
        status: "included", estimateKind: "estimate",
        quantity: {frames: 19800000, sequences: 38059, hours: 184},
        visual: {resolution: 378, patch: 14, pooling: 2, views: 1},
        control: {fps: 30, state: 6, action: 6, languagePerSequence: 16},
        evidence: [{
          kind: "paper fact", location: "PDF p. 5, §3.2",
          url: "https://arxiv.org/pdf/2605.02881v1",
          quote: "This corpus contains 38,059 robot demonstration episodes, 19.8M frames, and approximately 184 hours of interaction data."
        }],
        assumptions: [
          "One view is a conservative common denominator because camera layouts vary.",
          "Released 378/14 preprocessing and 2×2 image pooling apply.",
          "Scalar dimensions proxy tokens; language is 16 tokens/episode."
        ]
      },
      {
        id: "droid", label: "Quality-filtered DROID subset",
        status: "included", estimateKind: "estimate",
        quantity: {frames: 17758044, sequences: 74604},
        visual: {resolution: 378, patch: 14, pooling: 2, views: 2},
        control: {fps: 15, state: 8, action: 8, languagePerSequence: 16},
        evidence: [{
          kind: "paper fact", location: "PDF p. 6, §3.3",
          url: "https://arxiv.org/pdf/2605.02881v1",
          quote: "The resulting subset… contains 74,604 valid episodes comprising a total of 17,758,044 frames."
        }, {
          kind: "paper fact", location: "PDF p. 12, §4.3.1",
          url: "https://arxiv.org/pdf/2605.02881v1",
          statement: "Training uses one exterior view plus the wrist view at 15 Hz."
        }],
        assumptions: [
          "Released 378/14 preprocessing and 2×2 image pooling apply.",
          "Scalar dimensions proxy tokens; language is 16 tokens/episode."
        ]
      },
      {
        id: "academic", label: "Academic robot pool",
        status: "excluded",
        exclusionReason: "Subset sizes for BC-Z, BridgeData V2, RT-1, and MolmoAct Dataset are not disclosed.",
        evidence: [{
          kind: "paper fact", location: "PDF p. 6, §3.4",
          url: "https://arxiv.org/pdf/2605.02881v1",
          quote: "This pool consists of a targeted subset of the Open X-Embodiment… including BC-Z, BridgeData V2, and RT-1, together with MolmoAct Dataset…"
        }]
      },
      {
        id: "multimodal", label: "Molmo2 / Molmo2-ER / Tulu corpus",
        status: "excluded",
        exclusionReason: "≈12.51M examples are disclosed, but average consumed tokens per example are not.",
        evidence: [{
          kind: "paper fact", location: "PDF p. 3, Table 1",
          url: "https://arxiv.org/pdf/2605.02881v1",
          statement: "Table 1 reports 8.25M Molmo2, 3.26M Molmo2-ER, and 980K Tulu NLP examples."
        }]
      },
      {
        id: "openfast", label: "OpenFAST tokenizer corpus",
        status: "excluded",
        exclusionReason: "The 1M one-second samples overlap the robot corpora; stride and duplication are undisclosed.",
        evidence: [{
          kind: "paper fact", location: "PDF p. 8, §4.1.1",
          url: "https://arxiv.org/pdf/2605.02881v1",
          quote: "We subsample one million action sequences across five embodiments…"
        }, {
          kind: "paper fact", location: "PDF p. 8, §4.1.1",
          url: "https://arxiv.org/pdf/2605.02881v1",
          quote: "Each training sequence corresponds to one second of robot motion."
        }]
      },
      {
        id: "training-exposure", label: "Optimizer exposure",
        status: "context",
        exclusionReason: "Sampling weights and maximum sequence lengths describe exposure, not unique data volume.",
        evidence: [{
          kind: "paper fact", location: "PDF p. 9, §4.1.2",
          url: "https://arxiv.org/pdf/2605.02881v1",
          quote: "We allocate 10% of sampling to multimodal data and 90% to robot trajectories."
        }, {
          kind: "paper fact", location: "PDF pp. 9 and 11",
          url: "https://arxiv.org/pdf/2605.02881v1",
          statement: "The paper reports 200K pretraining steps and 100K post-training updates, both with global batch size 128."
        }]
      }
    ]
  },

  "π0.5": {
    primarySourceId: "mobile-manipulator",
    auditDoc: "docs/data-audit/pi05.md",
    params: 3.3, paramUnit: "1e9",
    novelty: 5, epochs: 1, countEveryStep: true,
    paper: "https://arxiv.org/abs/2504.16054",
    estimateKind: "partial estimate",
    parameterEvidence: {
      kind: "derived", location: "PDF p. 4, Figure 3",
      url: "https://arxiv.org/pdf/2504.16054v1",
      statement: "SigLIP (400M) + Gemma (2.6B) + action expert (300M) ≈ 3.3B; labels are rounded."
    },
    sources: [
      {
        id: "mobile-manipulator", label: "Mobile-manipulator household data",
        status: "included", estimateKind: "estimate",
        quantity: {hours: 400},
        visual: {resolution: 224, patch: 14, pooling: 1, views: 3},
        control: {fps: 50, state: 19, action: 19, languagePerSequence: 16, sequenceSeconds: 60},
        evidence: [{
          kind: "paper fact", location: "PDF p. 6, §IV-C",
          url: "https://arxiv.org/pdf/2504.16054v1",
          quote: "We use about 400 hours of data of mobile manipulators performing household tasks in about 100 different home environments…"
        }, {
          kind: "paper fact", location: "PDF p. 7, §IV-E",
          url: "https://arxiv.org/pdf/2504.16054v1",
          quote: "We use all four cameras for high-level inference, and the wrist and forward cameras for the low-level inference process."
        }],
        assumptions: [
          "50 Hz control is used as recorded FPS.",
          "224×224, patch 14, and no pooling are PaliGemma-family proxies not stated in this paper.",
          "Three low-level views, 60-second episodes, scalar-token proxies, and 16 language tokens/episode are used."
        ]
      },
      {
        id: "web-init", label: "Inherited web-trained VLM",
        status: "excluded",
        exclusionReason: "The inherited web corpus size and token count are not disclosed.",
        evidence: [{
          kind: "paper fact", location: "PDF p. 4, §IV",
          url: "https://arxiv.org/pdf/2504.16054v1",
          quote: "The model weights are initialized from a standard VLM trained on data from the web…"
        }]
      },
      {
        id: "non-mobile", label: "Non-mobile robot data",
        status: "excluded",
        exclusionReason: "No hours, episodes, frames, or example count is disclosed.",
        evidence: [{
          kind: "paper fact", location: "PDF p. 6, §IV-C",
          url: "https://arxiv.org/pdf/2504.16054v1",
          quote: "We also collected non-mobile robot data, either with a single arm or two arms, in a variety of home environments."
        }]
      },
      {
        id: "cross-embodiment", label: "Cross-embodiment and OXE data",
        status: "excluded",
        exclusionReason: "The consumed OXE subset and extended corpus size are not disclosed.",
        evidence: [{
          kind: "paper fact", location: "PDF p. 6, §IV-C",
          url: "https://arxiv.org/pdf/2504.16054v1",
          quote: "We also include the open-source OXE dataset [15]. This dataset is an extended version of the dataset used by π0 [8]."
        }]
      },
      {
        id: "high-level", label: "High-level and bounding-box annotations",
        status: "excluded",
        exclusionReason: "Annotations overlap robot trajectories and have no independent count.",
        evidence: [{
          kind: "paper fact", location: "PDF p. 6, §IV-C",
          url: "https://arxiv.org/pdf/2504.16054v1",
          quote: "we manually annotate all data with semantic descriptions of the subtasks"
        }, {
          kind: "paper fact", location: "PDF p. 6, §IV-C",
          url: "https://arxiv.org/pdf/2504.16054v1",
          quote: "also label relevant bounding boxes"
        }]
      },
      {
        id: "web-cotraining", label: "Multimodal web co-training",
        status: "excluded",
        exclusionReason: "Named datasets are disclosed, but the number of examples consumed by π0.5 is not.",
        evidence: [{
          kind: "paper fact", location: "PDF pp. 6–7, §IV-C",
          url: "https://arxiv.org/pdf/2504.16054v1",
          quote: "Finally we include a diverse set of web data involving image captioning (CapsFusion [87], COCO [12]), question answering (Cambrian-7M [77], PixMo [19], VQAv2 [32]), and object localization in pre-training."
        }]
      },
      {
        id: "verbal-instructions", label: "Verbal-instruction demonstrations",
        status: "excluded",
        exclusionReason: "Only an 11% mixture share is stated; the absolute high-level example count is unknown.",
        evidence: [{
          kind: "paper fact", location: "PDF p. 11, §V-E",
          url: "https://arxiv.org/pdf/2504.16054v1",
          quote: "the relatively small verbal instruction dataset… only constitutes about 11% of the high-level mobile manipulation examples."
        }]
      },
      {
        id: "mixture-exposure", label: "Training mixture and optimizer steps",
        status: "context",
        exclusionReason: "Mixture share and gradient steps do not disclose unique data volume.",
        evidence: [{
          kind: "paper fact", location: "PDF p. 2",
          url: "https://arxiv.org/pdf/2504.16054v1",
          quote: "The overwhelming majority of training examples provided to π0.5 (97.6% during the first training phase) do not come from mobile manipulators…"
        }, {
          kind: "paper fact", location: "PDF p. 7",
          url: "https://arxiv.org/pdf/2504.16054v1",
          statement: "The paper reports 280K pretraining and 80K post-training gradient steps but no batch size."
        }]
      }
    ]
  },

  "LingBot-VLA 2.0": {
    primarySourceId: "robot-50k",
    auditDoc: "docs/data-audit/lingbot-vla-2.md",
    params: 6.375907511, paramUnit: "1e9",
    novelty: 5, epochs: 1, countEveryStep: true,
    paper: "https://arxiv.org/abs/2607.06403",
    estimateKind: "estimate with upstream exclusions",
    parameterEvidence: {
      kind: "derived", location: "Pinned checkpoint index, metadata.total_size",
      url: "https://huggingface.co/robbyant/lingbot-vla-v2-6b/blob/11c703bf6a5c1f45b3b69168482da11fdbba53d7/model.safetensors.index.json",
      statement: "25,503,630,044 bytes of F32 weights ÷ 4 = 6,375,907,511 parameters."
    },
    sources: [
      {
        id: "robot-50k", label: "Cross-embodiment robot trajectories",
        status: "included", estimateKind: "estimate",
        quantity: {hours: 50000},
        visual: {resolution: 224, patch: 16, pooling: 2, views: 3},
        control: {fps: 30, state: 55, action: 55, languagePerSequence: 16, sequenceSeconds: 60},
        evidence: [{
          kind: "paper fact", location: "PDF p. 1, Abstract",
          url: "https://arxiv.org/pdf/2607.06403v1",
          quote: "50,000 hours of robot trajectories spanning 20 robot configurations and 10,000 hours of egocentric human videos."
        }, {
          kind: "paper fact", location: "PDF p. 6, §3.1.3",
          url: "https://arxiv.org/pdf/2607.06403v1",
          quote: "we use a 55-dimensional canonical vector representation for both states and actions."
        }],
        assumptions: [
          "30 Hz policy frequency is used as FPS; two configurations actually use 15 Hz but hours by embodiment are unknown.",
          "Three released-repository views and 224/16 preprocessing with 2×2 merge apply.",
          "Sequences average 60 seconds and language averages 16 tokens."
        ]
      },
      {
        id: "ego-10k", label: "Egocentric human video",
        status: "included", estimateKind: "estimate",
        quantity: {hours: 10000},
        visual: {resolution: 224, patch: 16, pooling: 2, views: 1},
        control: {fps: 30, state: 0, action: 0, languagePerSequence: 0, sequenceSeconds: 60},
        evidence: [{
          kind: "paper fact", location: "PDF p. 5, §3.1.2",
          url: "https://arxiv.org/pdf/2607.06403v1",
          quote: "We construct an egocentric human video pool of approximately 20,000 hours and retain around 10,000 hours of high-quality training data after filtering, reconstruction, standardization, and quality control."
        }],
        assumptions: [
          "The lower endpoint of the disclosed 30–60 policy frequency is used as video FPS.",
          "One view and the released 224/16 processor with 2×2 merge apply.",
          "Clip boundaries use an assumed mean of 60 seconds."
        ]
      },
      {
        id: "dino-video", label: "DINO-Video teacher corpus",
        status: "included", estimateKind: "one-pass estimate",
        quantity: {clips: 5000000, framesPerClip: 16},
        visual: {resolution: 256, patch: 16, pooling: 1, views: 1},
        control: {state: 0, action: 0, languagePerSequence: 0},
        evidence: [{
          kind: "paper fact", location: "PDF p. 10, §4.2",
          url: "https://arxiv.org/pdf/2607.06403v1",
          quote: "We train DINO-Video on 5M video clips spanning Internet, egocentric, and robotic data, using video-adapted DINO and iBOT self-distillation objectives [40]."
        }, {
          kind: "paper fact", location: "PDF p. 10, §4.2",
          url: "https://arxiv.org/pdf/2607.06403v1",
          quote: "For each sample, we uniformly sample 16 frames"
        }],
        assumptions: [
          "Each clip is one sequence; the pinned DINO config uses 256×256 and patch size 16.",
          "The total is one corpus pass because DINO epochs are undisclosed."
        ]
      },
      {
        id: "raw-pools", label: "Raw pre-filtering pools",
        status: "excluded",
        exclusionReason: "The 90K robot and 20K ego raw hours contain the retained 50K/10K corpora and would double-count rejected data.",
        evidence: [{
          kind: "paper fact", location: "PDF pp. 4–5, §3.1",
          url: "https://arxiv.org/pdf/2607.06403v1",
          statement: "Approximately 90,000 robot hours and 20,000 egocentric hours are filtered to 50,000 and 10,000 hours."
        }]
      },
      {
        id: "depth", label: "LingBot-Depth teacher data",
        status: "excluded",
        exclusionReason: "The geometric teacher is described, but its training-data quantity is not disclosed.",
        evidence: [{
          kind: "paper fact", location: "PDF pp. 9–10, §4.2",
          url: "https://arxiv.org/pdf/2607.06403v1",
          statement: "LingBot-Depth supplies geometric targets for current and future query distillation."
        }]
      },
      {
        id: "qwen", label: "Qwen3-VL upstream corpus",
        status: "excluded",
        exclusionReason: "The consumed upstream image, video, and text volume is not disclosed by the LingBot paper.",
        evidence: [{
          kind: "official artifact", location: "Released model configuration",
          url: "https://huggingface.co/robbyant/lingbot-vla-v2-6b/tree/11c703bf6a5c1f45b3b69168482da11fdbba53d7",
          statement: "The released model uses a Qwen3-VL-4B-Instruct backbone."
        }]
      },
      {
        id: "post-training", label: "Post-training data",
        status: "excluded",
        exclusionReason: "No general post-training hours, episode count, epochs, or mixture weights are disclosed for the released base model.",
        evidence: [{
          kind: "paper fact", location: "PDF §5",
          url: "https://arxiv.org/pdf/2607.06403v1",
          statement: "The paper reports evaluation trials but not a general post-training data quantity for the released base model."
        }]
      }
    ]
  }
};

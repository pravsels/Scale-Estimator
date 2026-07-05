// Model data for Scale Estimator.
// Edit these numbers as you read papers, or add new models — the dropdown and
// chart pick them up automatically. (Kept as .js, not .json, so it loads when
// you open index.html directly without running a server.)
//
// Values use the same units as the on-screen controls:
//   params     number, paired with paramUnit ("1e9" = B, "1e6" = M)
//   res        image resolution in px (square)
//   patch      ViT patch size in px
//   views      camera views
//   state      state/proprio tokens per control step
//   action     action tokens per control step
//   lang       language tokens per episode
//   fps        frame / control rate (Hz)
//   novelty    percent of each frame that is genuinely new (0-100)
//   eplen      average episode length in seconds
//   episodes   number of episodes (ignored if hours > 0)
//   hours      total dataset hours (overrides episodes x eplen if > 0)
//   epochs     passes over the dataset
//   countEveryStep  count state+action every step (true) or discount them (false)
//   paper      link to the source paper
//   note       short provenance chip shown in the header

const MODELS = {
  "MolmoAct2": {
    params: 7, paramUnit: "1e9",
    res: 224, patch: 14, views: 3,
    state: 8, action: 7, lang: 16,
    fps: 30, novelty: 5, eplen: 20,
    episodes: 86400, hours: 720, epochs: 1,
    countEveryStep: true,
    paper: "https://arxiv.org/abs/2605.02881",
    note: "720 h from paper; rest guessed"
  }
};

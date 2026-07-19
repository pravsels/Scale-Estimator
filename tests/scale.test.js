const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const projectFile = file => path.join(ROOT, file);

function loadScale() {
  const context = {
    sessionStorage: {
      getItem() { return null; },
      setItem() {},
      removeItem() {}
    }
  };
  vm.createContext(context);
  const source = fs.readFileSync(projectFile("data.js"), "utf8")
    + "\n" + fs.readFileSync(projectFile("scale.js"), "utf8")
    + "\nglobalThis.__api={MODELS,tokensFrom,sourceTokens,auditHTML,"
    + "applyPrimaryOverrides,editableDefaults,flopsRatioHTML,ROBOT_POINT,robotPointSVG};";
  vm.runInContext(source, context);
  return context.__api;
}

test("ships the three audited models and excludes GR00T", () => {
  const {MODELS} = loadScale();
  assert.deepEqual(
    Object.keys(MODELS),
    ["MolmoAct2", "π0.5", "LingBot-VLA 2.0"]
  );
});

test("calculates temporal source tokens from disclosed frames", () => {
  const {sourceTokens} = loadScale();

  const result = sourceTokens({
    id: "fixture",
    status: "included",
    quantity: {frames: 100, sequences: 10},
    visual: {resolution: 224, patch: 14, pooling: 1, views: 2},
    control: {state: 3, action: 2, languagePerSequence: 4}
  }, 0.1);

  assert.equal(result.frames, 100);
  assert.equal(result.sequences, 10);
  assert.equal(result.visualTokensPerFrame, 512);
  assert.equal(result.naive, 51_740);
  assert.equal(result.eff, 10_268);
});

test("rejects unaudited flat calculator inputs", () => {
  const {tokensFrom} = loadScale();
  assert.throws(() => tokensFrom({params: 1, paramUnit: "1e9"}), /audited sources/);
});

test("uses one shared robot marker renderer", () => {
  const {ROBOT_POINT, robotPointSVG} = loadScale();
  assert.equal(ROBOT_POINT.radius, 7);
  assert.match(
    robotPointSVG(1e9, 1e9, ROBOT_POINT.effective, "Robot", -13),
    /<circle[^>]+r=7[^>]+fill="#0d9488"/
  );
});

test("formats the shared GPT-3 compute comparison", () => {
  const {flopsRatioHTML} = loadScale();
  assert.match(flopsRatioHTML(3.14e23 / 2), /2\.0× smaller/);
});

test("derives LingBot teacher frames without double-counting exclusions", () => {
  const {MODELS, tokensFrom} = loadScale();
  const model = MODELS["LingBot-VLA 2.0"];
  const result = tokensFrom(model);
  const teacher = result.sources.find(source => source.id === "dino-video");

  assert.equal(teacher.frames, 80_000_000);
  assert.equal(teacher.naiveVisual, 20_480_000_000);
  assert.equal(result.sources.filter(source => source.included).length, 3);
  assert.ok(result.excludedSources.length >= 3);
  assert.equal(
    result.naive,
    result.sources.reduce((sum, source) => sum + source.naive, 0)
  );
});

test("every source has auditable evidence or an exclusion reason", () => {
  const {MODELS} = loadScale();

  for (const [name, model] of Object.entries(MODELS)) {
    assert.ok(model.sources.length > 0, `${name} has sources`);
    for (const source of model.sources) {
      assert.ok(source.id && source.label && source.status);
      assert.ok(
        source.evidence?.some(item =>
          item.url && item.location && Boolean(item.quote) !== Boolean(item.statement)
        )
          || source.exclusionReason,
        `${name}/${source.id} has typed evidence`
      );
    }
  }
});

test("keeps exact quotations in sync with each model audit", () => {
  const {MODELS} = loadScale();

  for (const [name, model] of Object.entries(MODELS)) {
    assert.ok(model.auditDoc, `${name} declares its audit document`);
    const audit = fs.readFileSync(projectFile(model.auditDoc), "utf8");
    const normalizedAudit = audit.replace(/\s+/g, " ");
    const evidence = [model.parameterEvidence]
      .concat(model.sources.flatMap(source => source.evidence || []))
      .filter(Boolean);
    for (const item of evidence.filter(item => item.quote)) {
      const quote = item.quote.replace(/\s+/g, " ");
      assert.ok(normalizedAudit.includes(quote), `${name} audit contains: ${item.quote}`);
    }
  }
});

test("renders quotations, math, and exclusions in the source audit", () => {
  const {MODELS, tokensFrom, auditHTML} = loadScale();
  const model = MODELS["LingBot-VLA 2.0"];
  const html = auditHTML(model, tokensFrom(model));

  assert.match(html, /Sources and conversion audit/);
  assert.match(html, /PDF p\. 10, §4\.2/);
  assert.match(html, /5,000,000 clips × 16 frames = 80,000,000 frames/);
  assert.match(html, /Excluded from total/);
  assert.match(html, /docs\/data-audit\/lingbot-vla-2\.md/);
  assert.doesNotMatch(html, /“25,503,630,044 bytes/);
});

test("declares contextual and unquantified sources without counting them", () => {
  const {MODELS, tokensFrom} = loadScale();
  assert.equal(MODELS.MolmoAct2.sources.find(source =>
    source.id === "training-exposure").status, "context");
  assert.equal(MODELS["π0.5"].sources.find(source =>
    source.id === "mixture-exposure").status, "context");
  assert.equal(MODELS["LingBot-VLA 2.0"].sources.find(source =>
    source.id === "post-training").status, "excluded");

  for (const model of Object.values(MODELS)) {
    const result = tokensFrom(model);
    assert.ok(result.sources.filter(source => source.status !== "included")
      .every(source => source.naive === 0 && source.eff === 0));
  }
});

test("what-if controls update only the primary quantified source", () => {
  const {MODELS, applyPrimaryOverrides, editableDefaults} = loadScale();
  const base = MODELS.MolmoAct2;
  const defaults = editableDefaults(base);
  assert.deepEqual(
    [defaults.res, defaults.patch, defaults.views, defaults.fps,
      defaults.state, defaults.action, defaults.lang, defaults.hours,
      defaults.episodes],
    [378, 14, 3, 30, 14, 14, 16, 720, 34500]
  );
  const changed = applyPrimaryOverrides(base, {
    hours: 100, episodes: 200, res: 280, patch: 14, views: 2,
    fps: 10, state: 4, action: 5, lang: 6, eplen: 30,
    novelty: 8, epochs: 2, countEveryStep: false
  });

  assert.equal(changed.sources[0].quantity.hours, 100);
  assert.equal(changed.sources[0].quantity.sequences, 200);
  assert.equal(changed.sources[0].visual.views, 2);
  assert.equal(changed.sources[0].control.fps, 10);
  assert.equal(changed.sources[1].quantity.frames, 19_800_000);
  assert.equal(base.sources[0].quantity.hours, 720);

  const reordered = Object.assign({}, base, {sources: base.sources.slice().reverse()});
  const reorderedChange = applyPrimaryOverrides(reordered, {
    hours: 50, episodes: 100, res: 224, patch: 14, views: 1,
    fps: 10, state: 2, action: 3, lang: 4, eplen: 20,
    novelty: 5, epochs: 1, countEveryStep: true
  });
  assert.equal(reorderedChange.sources.find(source => source.id === "yam").quantity.hours, 50);
});

test("stores source inputs once rather than duplicating editable defaults", () => {
  const {MODELS} = loadScale();
  const duplicated = ["name", "note", "res", "patch", "views", "state",
    "action", "lang", "fps", "eplen", "episodes", "hours"];

  for (const [name, model] of Object.entries(MODELS)) {
    for (const field of duplicated) {
      assert.equal(model[field], undefined, `${name} does not duplicate ${field}`);
    }
  }
});

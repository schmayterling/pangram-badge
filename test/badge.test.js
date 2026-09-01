import test from "node:test";
import assert from "node:assert/strict";
import { makeBadge, parsePangramResult, parsePangramUrl } from "../api/badge.js";

test("accepts pangram history links and removes tracking query", () => {
  const parsed = parsePangramUrl("https://www.pangram.com/history/0c34e370-1c78-4971-8db5-72f2c020f87a?ucc=example");
  assert.equal(parsed.sourceUrl, "https://www.pangram.com/history/0c34e370-1c78-4971-8db5-72f2c020f87a");
});

test("rejects non-pangram URLs", () => {
  assert.throws(() => parsePangramUrl("https://example.com/history/0c34e370-1c78-4971-8db5-72f2c020f87a"), /pangram/);
});

test("reads human verdict and confidence", () => {
  assert.deepEqual(parsePangramResult({ response: { overall: {
    prediction_short: "Human",
    fraction_human: 1,
    fraction_breakdown: { human: { "high-confidence": 1 } },
  } } }), {
    kind: "human",
    percentage: 100,
    confidence: "high",
    label: "100% human",
  });
});

test("reads AI verdict and confidence", () => {
  assert.deepEqual(parsePangramResult({ response: { overall: {
    prediction_short: "AI",
    fraction_ai: 1,
    fraction_breakdown: { ai: { "low-confidence": 1 } },
  } } }), {
    kind: "ai",
    percentage: 100,
    confidence: "low",
    label: "100% ai",
  });
});

test("badge escapes label text", () => {
  const badge = makeBadge({ label: "<human>", kind: "human", confidence: "high" });
  assert.match(badge, /&lt;human&gt;/);
  assert.doesNotMatch(badge, /<human>/);
});

test("badge includes pangram favicon paths", () => {
  const badge = makeBadge({ label: "100% human", kind: "human", confidence: "high" });
  assert.match(badge, /#FF6106/);
  assert.match(badge, /#FECAB9/);
  assert.match(badge, /high conf\./);
  assert.match(badge, /data-confidence="high"/);
  assert.match(badge, /data-verdict="100% human"/);
  assert.match(badge, /height="24"/);
  assert.equal(badge.match(/#16834f/g)?.length, 2);
});

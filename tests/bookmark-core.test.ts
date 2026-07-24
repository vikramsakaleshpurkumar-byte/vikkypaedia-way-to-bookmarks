import assert from "node:assert/strict";
import test from "node:test";
import {
  buildActionPack,
  canonicalUrl,
  findDuplicateGroups,
  findForgotten,
  parseNetscapeBookmarks,
  sampleBookmarks,
  searchBookmarks,
} from "../app/bookmark-core";

const exportFixture = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<DL><p>
  <DT><H3 ADD_DATE="1700000000">Research</H3>
  <DL><p>
    <DT><A HREF="https://example.com/ai-paper?utm_source=test" ADD_DATE="1600000000">AI &amp; clinical research</A>
    <DT><A HREF="https://example.com/ai-paper" ADD_DATE="1700000000">The same research paper</A>
  </DL><p>
  <DT><H3 ADD_DATE="1700000000">Travel</H3>
  <DL><p>
    <DT><A HREF="https://example.org/ahmedabad" ADD_DATE="1710000000">Architecture walk in Ahmedabad</A>
  </DL><p>
</DL><p>`;

test("parses Netscape bookmark HTML with folders and dates", () => {
  const parsed = parseNetscapeBookmarks(exportFixture);
  assert.equal(parsed.length, 3);
  assert.equal(parsed[0].title, "AI & clinical research");
  assert.equal(parsed[0].folder, "Research");
  assert.equal(parsed[2].intent, "visit");
});

test("canonical URLs remove tracking parameters", () => {
  assert.equal(
    canonicalUrl("https://www.example.com/read/?utm_source=newsletter#top"),
    "https://example.com/read",
  );
});

test("detects tracked duplicate destinations", () => {
  const duplicates = findDuplicateGroups(parseNetscapeBookmarks(exportFixture));
  assert.equal(duplicates.length, 1);
  assert.equal(duplicates[0].length, 2);
});

test("ranks natural intent searches", () => {
  const results = searchBookmarks(sampleBookmarks, "learn better meetings");
  assert.ok(results.length > 0);
  assert.equal(results[0].id, "sample-1");
});

test("identifies saves older than one year", () => {
  const forgotten = findForgotten(
    sampleBookmarks,
    new Date("2026-07-24T12:00:00+05:30"),
  );
  assert.ok(forgotten.length >= 6);
});

test("builds an action pack from selected saves", () => {
  const pack = buildActionPack([sampleBookmarks[2], sampleBookmarks[4]]);
  assert.match(pack.title, /decision pack/);
  assert.equal(pack.steps.length, 3);
});

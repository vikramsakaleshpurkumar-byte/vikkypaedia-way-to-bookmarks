"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  BookmarkItem,
  buildActionPack,
  findDuplicateGroups,
  findForgotten,
  parseNetscapeBookmarks,
  sampleBookmarks,
  searchBookmarks,
} from "./bookmark-core";

type View = "library" | "rescue" | "pack";
const STORAGE_KEY = "waymark-alpha-library";
const GITHUB_URL =
  "https://github.com/vikramsakaleshpurkumar-byte/vikkypaedia-way-to-bookmarks";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function BookmarkCard({
  item,
  selected,
  onToggle,
}: {
  item: BookmarkItem;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <article className={`bookmark-card ${selected ? "selected" : ""}`}>
      <button
        className="select-button"
        data-testid={`select-${item.id}`}
        aria-label={`${selected ? "Remove" : "Add"} ${item.title} ${
          selected ? "from" : "to"
        } action pack`}
        onClick={() => onToggle(item.id)}
      >
        {selected ? "✓" : "+"}
      </button>
      <div className="favicon" aria-hidden="true">
        {item.domain.slice(0, 1).toUpperCase()}
      </div>
      <div className="card-copy">
        <div className="card-kicker">
          <span>{item.domain}</span>
          <span>·</span>
          <span>{formatDate(item.addedAt)}</span>
        </div>
        <h3>{item.title}</h3>
        <p>{item.note || `Saved from ${item.folder || "the web"}`}</p>
        <div className="tag-row">
          <span className={`intent intent-${item.intent}`}>{item.intent}</span>
          {item.tags.slice(0, 2).map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>
      <a
        className="open-link"
        href={item.url}
        target="_blank"
        rel="noreferrer"
        aria-label={`Open ${item.title}`}
      >
        ↗
      </a>
    </article>
  );
}

export default function Home() {
  const [items, setItems] = useState<BookmarkItem[]>(sampleBookmarks);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("library");
  const [selected, setSelected] = useState<string[]>([]);
  const [notice, setNotice] = useState("A sample library is ready to explore.");
  const [hasImported, setHasImported] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as BookmarkItem[];
      if (Array.isArray(parsed) && parsed.length) {
        setItems(parsed);
        setHasImported(true);
        setNotice(`${parsed.length} bookmarks restored from this device.`);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const results = useMemo(
    () => searchBookmarks(items, query),
    [items, query],
  );
  const duplicates = useMemo(() => findDuplicateGroups(items), [items]);
  const forgotten = useMemo(() => findForgotten(items), [items]);
  const selectedItems = useMemo(
    () => items.filter((item) => selected.includes(item.id)),
    [items, selected],
  );
  const actionPack = useMemo(
    () => buildActionPack(selectedItems),
    [selectedItems],
  );

  function toggleSelected(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const imported = parseNetscapeBookmarks(text);
    if (!imported.length) {
      setNotice("No bookmarks were found. Try a Chrome or Firefox HTML export.");
      return;
    }
    setItems(imported);
    setSelected([]);
    setQuery("");
    setView("rescue");
    setHasImported(true);
    setNotice(
      `${imported.length} bookmarks imported privately. We found ${findDuplicateGroups(imported).length} duplicate groups and ${findForgotten(imported).length} forgotten saves.`,
    );
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(imported));
    event.target.value = "";
  }

  function restoreSample() {
    setItems(sampleBookmarks);
    setSelected([]);
    setQuery("");
    setView("library");
    setHasImported(false);
    setNotice("Sample library restored. Nothing personal is stored.");
    window.localStorage.removeItem(STORAGE_KEY);
  }

  function showWorkspace(nextView: View, nextQuery = "") {
    setQuery(nextQuery);
    setView(nextView);
    window.requestAnimationFrame(() => {
      document
        .getElementById("workspace")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function buildDemoPack() {
    setSelected(items.slice(0, 3).map((item) => item.id));
    setNotice("A three-source action pack is ready. Swap any source with one click.");
    showWorkspace("pack");
  }

  const visibleItems =
    view === "rescue"
      ? [...forgotten, ...duplicates.flatMap((group) => group)].filter(
          (item, index, all) =>
            all.findIndex((candidate) => candidate.id === item.id) === index,
        )
      : results;

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Waymark home">
          <span className="brand-mark">W</span>
          <span>Waymark</span>
          <small>ALPHA 01</small>
        </a>
        <div className="privacy-pill">
          <span className="privacy-dot" />
          Private on this device
        </div>
        <a className="github-link" href={GITHUB_URL} target="_blank" rel="noreferrer">
          GitHub
        </a>
        <button className="text-button" onClick={restoreSample}>
          Reset demo
        </button>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">YOUR PERSONAL ACTION MEMORY</p>
          <h1>
            Don&apos;t organize
            <br />
            your bookmarks.
            <br />
            <em>Rescue them.</em>
          </h1>
          <p className="lede">
            Import the links you forgot, find what matters in plain language,
            and turn a handful into something useful.
          </p>
          <div className="hero-actions">
            <button
              className="primary-button"
              data-testid="import-button"
              onClick={() => fileInput.current?.click()}
            >
              Import bookmark file <span>↑</span>
            </button>
            <button
              className="secondary-button"
              onClick={() => showWorkspace("rescue")}
            >
              Try the 60-second demo
            </button>
            <input
              ref={fileInput}
              className="visually-hidden"
              type="file"
              accept=".html,.htm"
              onChange={importFile}
              aria-label="Choose Chrome or Firefox bookmark export"
            />
            <span className="helper">
              Chrome → Bookmarks → Export bookmarks
            </span>
          </div>
          <details className="export-help">
            <summary>How do I export my bookmarks?</summary>
            <ol>
              <li>Open Chrome&apos;s Bookmark Manager.</li>
              <li>
                Choose the three-dot menu, then <strong>Export bookmarks</strong>.
              </li>
              <li>
                Import the downloaded HTML file here. It stays in this browser.
              </li>
            </ol>
          </details>
        </div>

        <aside className="rescue-note" aria-label="How Waymark works">
          <div className="note-tape" />
          <span className="note-number">01</span>
          <p>Save without filing.</p>
          <span className="note-number">02</span>
          <p>Find by what you remember.</p>
          <span className="note-number">03</span>
          <p>Turn memory into action.</p>
          <div className="scribble">less hoarding, more doing ↗</div>
        </aside>
      </section>

      <section className="quickstart" aria-labelledby="quickstart-title">
        <div className="quickstart-heading">
          <p className="eyebrow">NO SETUP REQUIRED</p>
          <h2 id="quickstart-title">See the idea in three clicks.</h2>
          <p>
            Use the fictional sample library before trusting Waymark with your
            own export.
          </p>
        </div>
        <div className="quickstart-grid">
          <button onClick={() => showWorkspace("library", "meetings")}>
            <span>01</span>
            <strong>Find by memory</strong>
            <small>Search “meetings,” not a perfect title.</small>
          </button>
          <button onClick={() => showWorkspace("rescue")}>
            <span>02</span>
            <strong>Rescue forgotten saves</strong>
            <small>Surface old links and duplicate destinations.</small>
          </button>
          <button onClick={buildDemoPack}>
            <span>03</span>
            <strong>Make an action pack</strong>
            <small>Turn three sources into a focused next step.</small>
          </button>
        </div>
      </section>

      <section
        className="workspace"
        id="workspace"
        aria-label="Bookmark rescue workspace"
      >
        <div className="workspace-head">
          <div>
            <p className="eyebrow">RESCUE DESK</p>
            <h2>{hasImported ? "Your library" : "A library to experiment with"}</h2>
          </div>
          <div className="stats" aria-label="Library statistics">
            <div>
              <strong>{items.length}</strong>
              <span>saves</span>
            </div>
            <div>
              <strong>{forgotten.length}</strong>
              <span>forgotten</span>
            </div>
            <div>
              <strong>{duplicates.length}</strong>
              <span>duplicate groups</span>
            </div>
          </div>
        </div>

        <div className="notice" role="status" data-testid="notice">
          <span>✦</span>
          {notice}
        </div>

        <div className="controls">
          <label className="search-box">
            <span>⌕</span>
            <input
              data-testid="search-input"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setView("library");
              }}
              placeholder='Try “the article about better meetings”'
              aria-label="Search your bookmarks"
            />
            {query && <kbd>{results.length} found</kbd>}
          </label>
          <nav className="view-tabs" aria-label="Workspace views">
            <button
              className={view === "library" ? "active" : ""}
              onClick={() => setView("library")}
            >
              Library
            </button>
            <button
              data-testid="rescue-tab"
              className={view === "rescue" ? "active" : ""}
              onClick={() => setView("rescue")}
            >
              Rescue <span>{forgotten.length + duplicates.length}</span>
            </button>
            <button
              data-testid="pack-tab"
              className={view === "pack" ? "active" : ""}
              onClick={() => setView("pack")}
            >
              Action pack <span>{selected.length}</span>
            </button>
          </nav>
        </div>

        {view === "pack" ? (
          <section className="pack" data-testid="action-pack">
            {selectedItems.length ? (
              <>
                <div className="pack-heading">
                  <div>
                    <p className="eyebrow">READY TO USE</p>
                    <h2>{actionPack.title}</h2>
                    <p>{actionPack.summary}</p>
                  </div>
                  <span className="pack-count">{selectedItems.length} sources</span>
                </div>
                <div className="pack-grid">
                  <article>
                    <h3>Suggested next moves</h3>
                    <ol>
                      {actionPack.steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  </article>
                  <article>
                    <h3>Your source trail</h3>
                    <ul className="source-list">
                      {selectedItems.map((item) => (
                        <li key={item.id}>
                          <a href={item.url} target="_blank" rel="noreferrer">
                            {item.title}
                          </a>
                          <button onClick={() => toggleSelected(item.id)}>
                            remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </article>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <span>↗</span>
                <h3>Choose a few useful saves.</h3>
                <p>
                  Use the plus buttons in your library. We&apos;ll turn them into
                  a focused next-step pack.
                </p>
                <button onClick={() => setView("library")}>
                  Browse the library
                </button>
              </div>
            )}
          </section>
        ) : (
          <>
            {view === "rescue" && (
              <div className="rescue-summary">
                <div>
                  <span className="rescue-icon">⌛</span>
                  <p>
                    <strong>{forgotten.length} forgotten saves</strong>
                    Worth another look because they are older than a year.
                  </p>
                </div>
                <div>
                  <span className="rescue-icon">⧉</span>
                  <p>
                    <strong>{duplicates.length} duplicate groups</strong>
                    Same destination, slightly different links.
                  </p>
                </div>
              </div>
            )}
            <div className="result-meta">
              <span>
                {visibleItems.length} {view === "rescue" ? "rescue candidates" : "results"}
              </span>
              <span>Press + to build an action pack</span>
            </div>
            <div className="bookmark-grid" data-testid="bookmark-grid">
              {visibleItems.map((item) => (
                <BookmarkCard
                  key={item.id}
                  item={item}
                  selected={selected.includes(item.id)}
                  onToggle={toggleSelected}
                />
              ))}
            </div>
            {!visibleItems.length && (
              <div className="empty-state">
                <span>⌕</span>
                <h3>No exact match—yet.</h3>
                <p>Try fewer words, a website name, an intention, or a topic.</p>
              </div>
            )}
          </>
        )}
      </section>

      <footer>
        <span>
          Waymark alpha · open source · built to test retrieval, not collect data
        </span>
        <span>
          Your library never leaves this browser.{" "}
          <a href={GITHUB_URL} target="_blank" rel="noreferrer">
            View the source
          </a>
        </span>
      </footer>
    </main>
  );
}

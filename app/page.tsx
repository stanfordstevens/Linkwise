"use client";

import { useMemo, useState } from "react";

type CategoryId = "synonym" | "rhyme" | "bird";

const categories: { id: CategoryId; label: string; accent: string }[] = [
  { id: "synonym", label: "Synonym", accent: "from-emerald-400/20 to-emerald-500/20" },
  { id: "rhyme", label: "Rhyme", accent: "from-sky-400/20 to-sky-500/20" },
  { id: "bird", label: "Type of Bird", accent: "from-amber-400/25 to-amber-500/20" },
];

const startWord = "Fast";
const endWord = "Day";

const birdWords = new Set([
  "swift",
  "jay",
  "sparrow",
  "robin",
  "wren",
  "finch",
  "hawk",
  "owl",
  "tern",
  "gull",
  "crow",
  "ostrich",
  "pelican",
  "flamingo"
]);

const synonymMap: Record<string, string[]> = {
  fast: ["swift", "quick", "rapid", "speedy", "brisk"],
  quick: ["fast", "swift", "rapid", "speedy", "brisk"],
  swift: ["fast", "quick", "rapid", "speedy"],
  jay: ["bird", "corvid"],
};

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [linkAssignments, setLinkAssignments] = useState<(CategoryId | null)[]>([
    null,
    null,
    null,
  ]);
  const [gaps, setGaps] = useState(["", ""]);
  const [gapErrors, setGapErrors] = useState<(string | null)[]>([null, null]);
  const [linkErrors, setLinkErrors] = useState<(string | null)[]>([null, null, null]);

  const categoryLookup = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.label])),
    []
  ) as Record<CategoryId, string>;

  const rhymeKey = (word: string) => {
    const lower = word.toLowerCase();
    const vowels = ["a", "e", "i", "o", "u", "y"];
    let lastVowelIdx = -1;

    for (let i = lower.length - 1; i >= 0; i -= 1) {
      if (vowels.includes(lower[i])) {
        lastVowelIdx = i;
        break;
      }
    }

    if (lastVowelIdx === -1) {
      return lower.slice(-3);
    }

    // Capture from the last vowel through the end; ensures "stick" and "quick" both yield "ick".
    const ending = lower.slice(lastVowelIdx);
    return ending.length >= 2 ? ending : lower.slice(-2);
  };

  const validateGapWord = (gapIndex: number, value: string): string | null => {
    const category = linkAssignments[gapIndex];
    if (!category) return null;

    const trimmed = value.trim();
    if (!trimmed) return null;

    const prevWord = gapIndex === 0 ? startWord : gaps[gapIndex - 1];
    const current = trimmed.toLowerCase();
    const previous = prevWord.trim().toLowerCase();

    if (category === "synonym") {
      const synonyms = synonymMap[previous];
      if (synonyms && !synonyms.includes(current)) {
        return `Should be a synonym of "${prevWord}".`;
      }
      return null;
    }

    if (category === "bird") {
      if (!birdWords.has(current)) {
        return `Should be a type of bird.`;
      }
      return null;
    }

    if (category === "rhyme") {
      if (rhymeKey(current) !== rhymeKey(previous)) {
        return `Should rhyme with "${prevWord}".`;
      }
      return null;
    }

    return null;
  };

  const handleSelectCategory = (id: CategoryId) => {
    setSelectedCategory((current) => (current === id ? null : id));
  };

  const handleSlotClick = (slotIndex: number) => {
    setLinkAssignments((prev) => {
      const next = [...prev];

      // Clear an assignment if no category is selected and slot already has one.
      if (!selectedCategory) {
        next[slotIndex] = null;
        setLinkErrors((errors) => {
          const updated = [...errors];
          updated[slotIndex] = null;
          return updated;
        });
        return next;
      }

      // Validate whether this category can follow the previous word.
      const prevWord =
        slotIndex === 0 ? startWord : gaps[slotIndex - 1] ? gaps[slotIndex - 1] : "";
      if (selectedCategory === "bird" && !birdWords.has(prevWord.trim().toLowerCase())) {
        setLinkErrors((errors) => {
          const updated = [...errors];
          updated[slotIndex] = `Previous word must be a type of bird.`;
          return updated;
        });
        return prev;
      }

      // Remove this category from any other slot so each is used once.
      next.forEach((cat, idx) => {
        if (idx !== slotIndex && cat === selectedCategory) {
          next[idx] = null;
        }
      });

      next[slotIndex] = selectedCategory;
      setLinkErrors((errors) => {
        const updated = [...errors];
        updated[slotIndex] = null;
        return updated;
      });
      return next;
    });

    // After placing, drop selection to encourage picking the next category.
    if (selectedCategory) {
      setSelectedCategory(null);
    }
  };

  const handleWordChange = (gapIndex: number, value: string) => {
    setGaps((prev) => {
      const next = [...prev];
      next[gapIndex] = value;
      return next;
    });

    const error = validateGapWord(gapIndex, value);
    setGapErrors((prev) => {
      const next = [...prev];
      next[gapIndex] = error;
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-50">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-12">
        <header className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
            Linkwise · Daily 1
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Build the chain</h1>
          <p className="max-w-2xl text-sm text-zinc-400 sm:text-base">
            Tap a category, choose which link slot it belongs to, then type the connecting
            word in the gap. Use each link exactly once to get from{" "}
            <span className="font-semibold text-zinc-100">{startWord}</span> to{" "}
            <span className="font-semibold text-zinc-100">{endWord}</span>.
          </p>
        </header>

        <section className="rounded-2xl border border-zinc-800/70 bg-zinc-900/50 p-6 shadow-xl shadow-black/30 backdrop-blur">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Categories
            </p>
            <p className="text-sm text-zinc-400">Pick a link type, then place it on a slot.</p>
            <p className="text-xs text-zinc-500">
              Tap a slot again with nothing selected to clear it.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {categories.map((category) => {
              const isSelected = selectedCategory === category.id;
              const isUsed = linkAssignments.includes(category.id);

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleSelectCategory(category.id)}
                  className={`relative overflow-hidden rounded-full border border-zinc-800 px-4 py-2 text-sm font-semibold transition hover:border-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70 ${
                    isSelected ? "ring-2 ring-amber-500/70" : ""
                  }`}
                >
                  <span
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${category.accent} opacity-70`}
                  />
                  <span className="relative flex items-center gap-2 text-zinc-100">
                    {category.label}
                    {isUsed && (
                      <span className="rounded-full bg-zinc-900/70 px-2 py-0.5 text-[11px] font-medium text-emerald-200">
                        placed
                      </span>
                    )}
                    {isSelected && (
                      <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[11px] font-medium text-amber-200">
                        active
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800/70 bg-zinc-900/50 p-6 shadow-xl shadow-black/30 backdrop-blur">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Chain
              </p>
              <p className="text-sm text-zinc-400">
                Place links and words in order; the next row appears after you fill the current one.
              </p>
            </div>
          </div>

          {/*
            Determine validation completion for gating progression and styling.
            A gap is "valid" when it has text, has no error, and its link category is placed.
          */}
          {(() => {
            const gap1Valid = Boolean(linkAssignments[0] && gaps[0].trim() && !gapErrors[0]);
            const gap2Valid = Boolean(linkAssignments[1] && gaps[1].trim() && !gapErrors[1]);
            return (
          <div className="relative">
            <div className="absolute left-5 top-8 bottom-8 w-px bg-zinc-800" />

            <div className="relative flex flex-col gap-6">
              {/* Start word */}
              <WordCard label="Start word" value={startWord} locked />

              {/* Link slot 1 */}
              <LinkSlot
                index={0}
                assignment={linkAssignments[0]}
                categoryLookup={categoryLookup}
                onClick={() => handleSlotClick(0)}
                isActiveSelection={selectedCategory !== null}
              />

              {/* Gap 1 appears after first link is placed */}
              {linkAssignments[0] && (
                <GapInput
                  label="Gap word"
                  placeholder="Type a word that fits the link above"
                  value={gaps[0]}
                  onChange={(value) => handleWordChange(0, value)}
                  success={gap1Valid}
                  error={gapErrors[0]}
                />
              )}

              {/* Link slot 2 appears after first gap is filled */}
              {gap1Valid && (
                <LinkSlot
                  index={1}
                  assignment={linkAssignments[1]}
                  categoryLookup={categoryLookup}
                  onClick={() => handleSlotClick(1)}
                  isActiveSelection={selectedCategory !== null}
                  error={linkErrors[1]}
                />
              )}

              {/* Gap 2 appears after second link is placed */}
              {gap1Valid && linkAssignments[1] && (
                <GapInput
                  label="Gap word"
                  placeholder="Type the next connector"
                  value={gaps[1]}
                  onChange={(value) => handleWordChange(1, value)}
                  success={gap2Valid}
                  error={gapErrors[1]}
                />
              )}

              {/* Link slot 3 appears after second gap is filled */}
              {gap2Valid && (
                <LinkSlot
                  index={2}
                  assignment={linkAssignments[2]}
                  categoryLookup={categoryLookup}
                  onClick={() => handleSlotClick(2)}
                  isActiveSelection={selectedCategory !== null}
                  error={linkErrors[2]}
                />
              )}

              {/* End word always visible */}
              <WordCard label="End word" value={endWord} locked />
            </div>
          </div>
            );
          })()}
        </section>
      </div>
    </div>
  );
}

type WordCardProps = {
  label: string;
  value: string;
  locked?: boolean;
};

function WordCard({ label, value, locked }: WordCardProps) {
  return (
    <div className="relative pl-10">
      <div className="absolute left-1.5 top-2 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(16,185,129,0.15)]" />
      <div className="flex flex-col gap-2">
        <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</div>
        <div className="rounded-xl border border-zinc-800/70 bg-zinc-900/80 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-zinc-50">{value}</span>
            {locked && (
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
                given
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type GapInputProps = {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  success?: boolean;
  error?: string | null;
};

function GapInput({ label, placeholder, value, onChange, success, error }: GapInputProps) {
  const showSuccess = success && !error && value.trim().length > 0;
  return (
    <div className="relative pl-10">
      <div className="absolute left-1.5 top-2 h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_0_6px_rgba(251,191,36,0.15)]" />
      <div className="flex flex-col gap-2">
        <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</div>
        <div>
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            className={`w-full rounded-xl border px-4 py-3 text-base font-semibold text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 ${
              error
                ? "border-rose-500/60 bg-rose-500/5 focus:border-rose-500/80 focus:ring-rose-500/30"
                : showSuccess
                ? "border-emerald-500/70 bg-emerald-500/5 focus:border-emerald-400/80 focus:ring-emerald-400/30"
                : "border-zinc-800/70 bg-zinc-950/60 focus:border-amber-400/60 focus:ring-amber-400/40"
            }`}
          />
          {error && <p className="mt-2 text-xs font-semibold text-rose-200">{error}</p>}
          {!error && showSuccess && (
            <p className="mt-2 text-xs font-semibold text-emerald-200">Accepted</p>
          )}
        </div>
      </div>
    </div>
  );
}

type LinkSlotProps = {
  index: number;
  assignment: CategoryId | null;
  categoryLookup: Record<CategoryId, string>;
  onClick: () => void;
  isActiveSelection: boolean;
  error?: string | null;
};

function LinkSlot({
  index,
  assignment,
  categoryLookup,
  onClick,
  isActiveSelection,
  error,
}: LinkSlotProps) {
  const label = assignment ? categoryLookup[assignment] : null;
  const slotNumber = index + 1;

  return (
    <div className="relative pl-10">
      <div className="absolute left-1.5 top-2 h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_0_6px_rgba(56,189,248,0.15)]" />
      <div className="flex flex-col gap-2">
        <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Link {slotNumber}</div>
        <div>
          <button
            type="button"
            onClick={onClick}
            className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 ${
              label
                ? "border-sky-400/50 bg-sky-400/10 text-sky-50 focus-visible:ring-amber-500/70"
                : "border-zinc-800/70 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900/60 focus-visible:ring-amber-500/70"
            } ${error ? "border-rose-500/70 bg-rose-500/5 focus-visible:ring-rose-500/40" : ""}`}
          >
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                {label ? "Placed" : "Select & place"}
              </span>
              <span className="text-base font-semibold">
                {label ?? "Tap a category, then tap here"}
              </span>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
                isActiveSelection
                  ? "bg-amber-400/20 text-amber-200"
                  : label
                  ? "bg-sky-400/20 text-sky-100"
                  : error
                  ? "bg-rose-500/20 text-rose-100"
                  : "bg-zinc-800 text-zinc-300"
              }`}
            >
              {label ? "Linked" : isActiveSelection ? "Ready" : "Empty"}
            </span>
          </button>
          {error && <p className="mt-2 text-xs font-semibold text-rose-200">{error}</p>}
        </div>
      </div>
    </div>
  );
}

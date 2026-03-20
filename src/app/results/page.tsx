import Link from "next/link";
import { Suspense } from "react";
import { Syne } from "next/font/google";
import peptides from "@/data/peptides.json";
import vendors from "@/data/vendors.json";
import { buildAffiliateUrl } from "@/lib/affiliate";

const syne = Syne({ subsets: ["latin"], weight: ["800"] });

const navy = "#1A1A2E";
const dark = "#111111";
const muted = "#888888";
const border = "#E8E8E8";

type Peptide = typeof peptides[0];
type Vendor = typeof vendors[0];

// ── Q1: Goal → ordered peptide candidates ────────────────────────────────────
const goalMap: Record<string, string[]> = {
  muscle:    ["aod-9604", "ipamorelin", "cjc-1295"],
  energy:    ["semax", "selank", "nad-plus"],
  recovery:  ["bpc-157", "tb-500"],
  sleep:     ["dsip", "ipamorelin", "selank"],
  antiaging: ["epithalon", "ghk-cu", "nad-plus"],
  skin:      ["ghk-cu", "bpc-157", "epithalon"],
};

// Peptides usable without SubQ injection (oral, nasal, or topical)
const oralNasalSafe = new Set(["bpc-157", "semax", "selank", "ghk-cu", "nad-plus"]);

// ── Q2: Concern → reassurance copy ───────────────────────────────────────────
const concernReassurance: Record<string, string> = {
  safety:    "Every peptide in your protocol has a strong safety profile. Here's what the research shows.",
  efficacy:  "These peptides have the strongest evidence behind them for your specific goals.",
  sourcing:  "We only recommend vendors we'd use ourselves. Every source below is vetted.",
  injection: "We've selected protocols with the least intimidating administration methods for your stack.",
  cost:      "We've prioritized the best value options for your budget without compromising quality.",
};

// ── Q6: Social proof lines ────────────────────────────────────────────────────
const socialProof: Record<string, string> = {
  "bpc-157":    "Used by athletes and biohackers for rapid tissue repair — noticeable joint improvements within 2–4 weeks.",
  "tb-500":     "Popular in the fitness community for healing chronic injuries that simply won't quit.",
  "ipamorelin": "Widely used for its clean GH release — deep sleep improvements reported within the first week.",
  "cjc-1295":   "A staple in body recomposition stacks — often paired with Ipamorelin for amplified results.",
  "aod-9604":   "Gaining traction for stubborn fat loss, especially around the midsection.",
  "semax":      "Strong following in nootropic communities for sharp focus without stimulants or crashes.",
  "selank":     "Often described as 'calm focus' — widely used during high-stress periods.",
  "dsip":       "One of the most direct sleep peptides — effects typically felt on night one.",
  "epithalon":  "Used by longevity-focused biohackers — typically run 1–2 cycles per year.",
  "ghk-cu":     "A staple in advanced skincare — strong clinical and community results.",
  "nad-plus":   "IV NAD+ is consistently described as a transformative energy experience.",
};

// Monthly cost estimates (rough midpoint for budget display)
const monthlyEstimate: Record<string, string> = {
  "bpc-157":    "~$45/mo",
  "tb-500":     "~$60/mo",
  "ipamorelin": "~$70/mo",
  "cjc-1295":   "~$65/mo",
  "aod-9604":   "~$55/mo",
  "semax":      "~$40/mo",
  "selank":     "~$35/mo",
  "dsip":       "~$50/mo",
  "epithalon":  "~$80/mo",
  "ghk-cu":     "~$30/mo",
  "nad-plus":   "~$90/mo",
};

const goalLabel: Record<string, string> = {
  muscle: "Body Comp & Fat Loss", energy: "Energy & Focus",
  recovery: "Recovery & Healing", sleep: "Sleep & Stress",
  antiaging: "Anti-Aging & Longevity", skin: "Skin & Appearance",
};

// ── Vendor selection — ordered by budget tier preference ─────────────────────
function getVendorsForPeptide(peptideId: string, budget: string, isBeginnerCard: boolean): Vendor[] {
  const matching = vendors.filter((v) => v.peptides.includes(peptideId));

  const tierOrder =
    budget === "low" || isBeginnerCard
      ? ["biotech-peptides", "peptide-sciences", "limitless-life"]
      : budget === "medium"
      ? ["peptide-sciences", "biotech-peptides", "limitless-life"]
      : ["limitless-life", "peptide-sciences", "biotech-peptides"];

  matching.sort((a, b) => {
    const ai = tierOrder.indexOf(a.id);
    const bi = tierOrder.indexOf(b.id);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const limit = budget === "low" || isBeginnerCard ? 1 : 2;
  return matching.slice(0, limit);
}

// ── Core recommendation engine ────────────────────────────────────────────────
function getRecommendations(
  goals: string[],
  experience: string,
  injectionPref: string,
  budget: string
): { recs: Peptide[]; injectionFallback: boolean } {
  const scores: Record<string, number> = {};
  for (const goal of goals) {
    const list = goalMap[goal] ?? [];
    list.forEach((id, idx) => {
      scores[id] = (scores[id] ?? 0) + (list.length - idx);
    });
  }

  let candidates = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);

  let injectionFallback = false;
  if (injectionPref === "no") {
    const safe = candidates.filter((id) => oralNasalSafe.has(id));
    if (safe.length === 0) {
      injectionFallback = true;
      candidates = candidates.slice(0, 1);
    } else {
      candidates = safe;
    }
  }

  const experienceMax =
    experience === "beginner" ? 1 :
    experience === "basic" ? 2 : 3;

  const budgetMax =
    budget === "low" ? 1 :
    budget === "medium" ? 2 : experienceMax;

  const limit = Math.min(experienceMax, budgetMax);
  candidates = candidates.slice(0, Math.max(limit, 1));

  const recs = candidates
    .map((id) => peptides.find((p) => p.id === id))
    .filter(Boolean) as Peptide[];

  return { recs, injectionFallback };
}

// ── Peptide card ──────────────────────────────────────────────────────────────
function PeptideCard({
  peptide, index, displayStyle, isBeginnerCard, injectionPref, injectionFallback, budget, showCost,
}: {
  peptide: Peptide; index: number; displayStyle: string;
  isBeginnerCard: boolean; injectionPref: string; injectionFallback: boolean;
  budget: string; showCost: boolean;
}) {
  const peptideVendors = getVendorsForPeptide(peptide.id, budget, isBeginnerCard);
  const isMinimal = displayStyle === "minimal";
  const showScience = displayStyle === "science";
  const showSocial = displayStyle === "social";
  const showInjectionNote = injectionPref === "nervous" && peptide.method === "injection";

  // Zero-padded card number pill: 01, 02, 03
  const cardNum = String(index + 1).padStart(2, "0");

  const labelStyle = {
    fontSize: "12px", fontWeight: 600, color: muted, marginBottom: "4px",
  } as const;

  return (
    <div style={{
      background: "#FFFFFF", border: `1px solid ${border}`,
      borderLeft: `4px solid ${navy}`, borderRadius: "12px", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ padding: "14px 16px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          {/* Navy pill number badge */}
          <span style={{
            fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "100px",
            background: navy, color: "#fff", letterSpacing: "0.04em",
          }}>{cardNum}</span>
          {isBeginnerCard && (
            <span style={{
              fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "100px",
              background: "#F0FDF4", color: "#166534", letterSpacing: "0.02em",
            }}>Start here</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          <div style={{ fontSize: "20px", fontWeight: 700, color: dark }}>{peptide.name}</div>
          {!isMinimal && (
            <Link href={`/peptides/${peptide.id}`} style={{ fontSize: "12px", color: navy, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" as const }}>
              Full profile →
            </Link>
          )}
        </div>
        {!isMinimal && (
          <div style={{ fontSize: "14px", color: muted, marginTop: "4px" }}>{peptide.goals[0]}</div>
        )}
      </div>

      {/* Q4 injection fallback note */}
      {injectionFallback && (
        <div style={{ padding: "10px 16px", paddingTop: 0 }}>
          <div style={{ background: "#FFF8F0", borderRadius: "8px", padding: "10px 12px" }}>
            <p style={{ fontSize: "12px", color: "#92400E", margin: 0, lineHeight: 1.5 }}>
              This peptide works best via injection but oral options exist — ask your clinician about oral BPC-157 or nasal alternatives.
            </p>
          </div>
        </div>
      )}

      {/* Q4 nervous reassurance */}
      {showInjectionNote && (
        <div style={{ padding: "10px 16px", paddingTop: 0 }}>
          <div style={{ background: "#F0F9FF", borderRadius: "8px", padding: "10px 12px" }}>
            <p style={{ fontSize: "12px", color: "#0369A1", margin: 0, lineHeight: 1.5 }}>
              Subcutaneous injection is similar to what diabetics do daily — most people describe it as barely noticeable.
            </p>
          </div>
        </div>
      )}

      {/* Q6 science: how it works */}
      {showScience && (
        <div style={{ padding: "0 16px 14px" }}>
          <div style={labelStyle}>How it works</div>
          <p style={{ fontSize: "13px", color: "#444", lineHeight: 1.6, margin: 0 }}>{peptide.howItWorks}</p>
        </div>
      )}

      {/* Q6 social: community proof */}
      {showSocial && socialProof[peptide.id] && (
        <div style={{ padding: "0 16px 14px" }}>
          <div style={labelStyle}>Community</div>
          <p style={{ fontSize: "13px", color: "#444", lineHeight: 1.5, margin: 0, fontStyle: "italic" }}>&ldquo;{socialProof[peptide.id]}&rdquo;</p>
        </div>
      )}

      {/* Dosing row */}
      <div style={{ padding: "0 16px 14px", display: "flex", gap: "20px", flexWrap: "wrap" as const }}>
        <div>
          <div style={labelStyle}>Dosing</div>
          <div style={{ fontSize: "13px", color: dark }}>{peptide.dosing.split(",")[0]}</div>
        </div>
        <div>
          <div style={labelStyle}>Method</div>
          <div style={{ fontSize: "13px", color: dark, textTransform: "capitalize" as const }}>{peptide.method}</div>
        </div>
        {showCost && monthlyEstimate[peptide.id] && (
          <div>
            <div style={labelStyle}>Est. cost</div>
            <div style={{ fontSize: "13px", color: dark }}>{monthlyEstimate[peptide.id]}</div>
          </div>
        )}
      </div>

      {/* Vendor row */}
      {peptideVendors.length > 0 && (
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${border}`, display: "flex", flexDirection: "column" as const, gap: "10px" }}>
          <div style={labelStyle}>Best sources</div>
          {peptideVendors.map((v) => (
            <div key={v.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: dark }}>{v.name}</div>
                {v.badge && (
                  <span style={{
                    fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "100px",
                    background: v.badge === "Best Value" ? "#4CAF50" : navy,
                    color: "#fff",
                    letterSpacing: "0.02em",
                  }}>{v.badge}</span>
                )}
              </div>
              <a
                href={buildAffiliateUrl(v.affiliateBase, v.utmSource, v.utmMedium, peptide.id)}
                target="_blank" rel="noopener noreferrer sponsored"
                style={{ background: navy, color: "#fff", fontSize: "12px", fontWeight: 700, padding: "8px 14px", borderRadius: "8px", textDecoration: "none", whiteSpace: "nowrap" as const, flexShrink: 0 }}
              >
                Best Source →
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Q6 guided: 3-step getting started guide ───────────────────────────────────
function GettingStarted({ recs }: { recs: Peptide[] }) {
  return (
    <div style={{ marginTop: "24px", padding: "16px", background: "#F9F9F9", border: `1px solid ${border}`, borderRadius: "12px" }}>
      <div style={{ fontSize: "15px", fontWeight: 700, color: dark, marginBottom: "14px" }}>Getting started — step by step</div>
      {[
        `Order ${recs.map(p => p.name).join(" + ")} from one of the vetted vendors above.`,
        "Watch our injection tutorial before your first dose — it takes 2 minutes.",
        "Start your protocol on day 1. Track how you feel weekly. Most effects show within 2–4 weeks.",
      ].map((step, i) => (
        <div key={i} style={{ display: "flex", gap: "12px", marginBottom: i < 2 ? "12px" : 0 }}>
          <div style={{ width: "22px", height: "22px", borderRadius: "50%", border: `2px solid ${navy}`, color: navy, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0, marginTop: "1px" }}>
            {i + 1}
          </div>
          <p style={{ fontSize: "14px", color: "#444", lineHeight: 1.5, margin: 0 }}>{step}</p>
        </div>
      ))}
    </div>
  );
}

// ── Results page ──────────────────────────────────────────────────────────────
function ResultsContent({ params }: { params: Record<string, string> }) {
  const goals         = (params.goals    ?? "recovery").split(",").filter(Boolean);
  const experience    = params.experience ?? "basic";
  const injectionPref = params.injection  ?? "fine";
  const budget        = params.budget     ?? "medium";
  const displayStyle  = params.style      ?? "minimal";
  const topConcern    = (params.concern   ?? "").split(",")[0];

  const isBeginnerCard = experience === "beginner";
  const showCost = budget === "low" || budget === "unlimited";

  const { recs, injectionFallback } = getRecommendations(goals, experience, injectionPref, budget);

  return (
    <div style={{ padding: "24px 20px 48px" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: muted, margin: "0 0 6px" }}>
          Your Protocol
        </p>
        <h1 className={syne.className} style={{ fontSize: "30px", fontWeight: 800, color: dark, margin: "0 0 6px", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
          Your Protocol is Ready.
        </h1>
        <p style={{ fontSize: "14px", color: muted, margin: 0 }}>
          Personalized to your goals.
        </p>
      </div>

      {/* Q2 concern reassurance — subtle, no border */}
      {concernReassurance[topConcern] && (
        <div style={{ background: "#EEF4FF", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px" }}>
          <p style={{ fontSize: "13px", color: "#3B5998", margin: 0, lineHeight: 1.5 }}>
            {concernReassurance[topConcern]}
          </p>
        </div>
      )}

      {/* Peptide cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "20px" }}>
        {recs.map((peptide, i) => (
          <PeptideCard
            key={peptide.id}
            peptide={peptide}
            index={i}
            displayStyle={displayStyle}
            isBeginnerCard={isBeginnerCard}
            injectionPref={injectionPref}
            injectionFallback={injectionFallback}
            budget={budget}
            showCost={showCost}
          />
        ))}
      </div>

      {/* Q6 guided: 3-step guide */}
      {displayStyle === "guided" && <GettingStarted recs={recs} />}

      <p style={{ fontSize: "11px", color: "#AAAAAA", textAlign: "center", margin: "20px 0" }}>
        * Affiliate links — we earn a commission at no extra cost to you.
      </p>

      {/* Bottom buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <Link href="/quiz" style={{ display: "block", textAlign: "center", padding: "16px", background: "#FFFFFF", border: `1px solid ${navy}`, borderRadius: "10px", fontSize: "16px", fontWeight: 700, color: navy, textDecoration: "none" }}>
          ← Retake Quiz
        </Link>
        <button style={{ display: "block", width: "100%", textAlign: "center", padding: "16px", background: "#4CAF50", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
          Save My Protocol
        </button>
        <Link href="/peptides" style={{ display: "block", textAlign: "center", padding: "16px", background: navy, borderRadius: "10px", fontSize: "16px", fontWeight: 700, color: "#fff", textDecoration: "none" }}>
          Browse All Peptides
        </Link>
      </div>
    </div>
  );
}

async function Inner({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  return <ResultsContent params={params} />;
}

export default function ResultsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: "12px" }}>
        <div style={{ fontSize: "36px" }}>🧬</div>
        <p style={{ color: muted, fontSize: "15px" }}>Loading your protocol...</p>
      </div>
    }>
      <Inner searchParams={searchParams} />
    </Suspense>
  );
}

"use client";

import { usePathname } from "next/navigation";

export default function NavBar() {
  const pathname = usePathname();
  const isQuiz = pathname?.startsWith("/quiz");
  const isResults = pathname?.startsWith("/results");

  return (
    <nav style={{
      display: "grid",
      gridTemplateColumns: "1fr auto 1fr",
      alignItems: "center",
      padding: "16px 20px",
      borderBottom: "1px solid #EEEEEE",
    }}>
      {/* Left — Directory link (hidden on quiz and results) */}
      <div>
        {!isQuiz && !isResults && (
          <a href="/peptides" style={{ fontSize: "13px", fontWeight: 500, color: "#AAAAAA", textDecoration: "none" }}>
            Directory
          </a>
        )}
      </div>

      {/* Center — Logo */}
      <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "5px" }}>
        <span style={{ fontSize: "20px", fontWeight: 700, color: "#111111", letterSpacing: "-0.02em" }}>Pep</span>
        <span style={{
          fontSize: "11px", fontWeight: 700, color: "#FFFFFF",
          background: "#1A1A2E", borderRadius: "100px",
          padding: "3px 8px", letterSpacing: "0.03em",
          lineHeight: "18px",
        }}>
          AI
        </span>
      </a>

      {/* Right — Share results on results page, empty elsewhere */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        {isResults && (
          <span style={{ fontSize: "13px", fontWeight: 500, color: "#AAAAAA", cursor: "pointer" }}>
            Share results
          </span>
        )}
      </div>
    </nav>
  );
}

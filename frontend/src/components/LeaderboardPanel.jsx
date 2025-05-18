import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, X } from "lucide-react";
import { getLeaderboard } from "@/api/info";

export default function LeaderboardPanel({ currentPlayer }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [activeTab, setActive] = useState("global");

  /* -------- fetch logic -------- */
  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLeaderboard();
      setData(res);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (open && !data && !loading) fetchLeaderboard(); },
    [open, data, loading, fetchLeaderboard]);

  useEffect(() => {
    const esc = (e) => e.key === "Escape" && setOpen(false);
    if (open) window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  return (
    <>
      {/* ─────────── launcher ─────────── */}
      <button className="leaderboard-launch" onClick={() => setOpen(true)}>
        <Trophy className="w-7 h-7 text-white" />
      </button>

      {/* ─────────── overlay / modal ─────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="leaderboard-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="leaderboard-modal"
              initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* header */}
              <header className="leaderboard-header">
                <h2 className="leaderboard-title font-block">Leaderboard</h2>
                <button className="leaderboard-close" onClick={() => setOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </header>

              {/* tabs */}
              <nav className="leaderboard-tabs">
                <button
                  className={`leaderboard-tab ${activeTab === "global" ? "active" : ""} font-block`}
                  onClick={() => setActive("global")}
                >
                  Global
                </button>
                <button
                  className={`leaderboard-tab ${activeTab === "regional" ? "active" : ""} font-block`}
                  onClick={() => setActive("regional")}
                >
                  {data?.region || "Regional"}
                </button>
              </nav>

              {/* rows */}
              <div className="leaderboard-table">
                {loading ? (
                  <SkeletonList />
                ) : (
                  data && (
                    activeTab === "global" ? (
                      <LeaderboardTable
                        entries={data.global_top10}
                        playerRank={data.global_rank}
                        player={currentPlayer}
                        showCountry
                      />
                    ) : (
                      <LeaderboardTable
                        entries={data.regional_top10}
                        playerRank={data.regional_rank}
                        player={currentPlayer}
                        showCountry={false}
                      />
                    )
                  )
                )}
              </div>

              {/* footer */}
              <footer className="leaderboard-footer">
                {data
                  ? `Refreshed ${data.last_update} minute${data.last_update === 1 ? "" : "s"} ago`
                  : "Fetching…"}
              </footer>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ---------- helpers ---------- */

function LeaderboardTable({ entries = [], playerRank, player, showCountry }) {
  const rows = [...entries.map(e => ({ ...e, highlight: player && e.uid === player.uid }))];

  // tack current player on end if not in top 10
  if (playerRank && player && playerRank > 10) {
    rows.push({ ...player, rank: playerRank, highlight: true });
  }

  return rows.map((r) => (
    <LeaderboardRow key={r.rank} {...r} showCountry={showCountry} />
  ));
}

function LeaderboardRow({ rank, display_name, total_won, elo, country, highlight, showCountry }) {
  const flagUrl = useFlagUrl(country);
  return (
    <div className={`leaderboard-row ${highlight ? "highlight" : ""}`}>
      <span className="rank-col font-comic">{rank}</span>
      <span className="name-col font-bubble">{display_name}</span>
      <span className="wins-col font-comic">🏆{total_won ?? "-"}</span>
      <span className="elo-col font-comic">{elo}</span>
      <span className="flag-col">
        {showCountry && flagUrl && (
          <img src={flagUrl} alt={`${country} flag`} />
        )}
      </span>
    </div>
  );
}

function SkeletonList() {
  return (
    <>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="leaderboard-skeleton">
          <div style={{ gridColumn: "1 / -1" }} />
        </div>
      ))}
    </>
  );
}

function useFlagUrl(country) {
  return useMemo(() => {
    if (!country) return null;
    if (country.toUpperCase() === "DEV") return "/flags/devflag.svg";
    if (country.toUpperCase() === "IDK") return "/flags/idkflag.svg";
    return `https://flagcdn.com/${country.toLowerCase()}.svg`;
  }, [country]);
}

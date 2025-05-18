import CountdownTimer from "@/components/Timer";
import LifeCard from "@/components/LifeCard";

/**
 * Top bar that shows each player’s life and a central countdown timer.
 *
 * Props
 * ──────────────────────────────────────────────────────────────
 * @param {{0:string,1:number}}  myLifeEntry        – tuple [uid, life]
 * @param {{0:string,1:number}}  opponentLifeEntry  – tuple [uid, life]
 * @param {boolean}              answered           – true once player has answered
 * @param {number}               questionTimeout    – seconds for <CountdownTimer>
 * @param {number}               questionIndex      – key so the timer resets each question
 */
export default function GameTopBar({
  myLifeEntry,
  opponentLifeEntry,
  answered,
  questionTimeout,
  questionIndex,
}) {
  return (
    <header className="pixel-top-bar flex items-center text-lg sm:text-xl w-full max-w-5xl mx-auto mb-6 sm:mb-8">
      <div className="flex-1 text-left overflow-hidden">
        <div className="max-w-[12ch] truncate inline-block">
          <LifeCard entry={myLifeEntry} size="lg" />
        </div>
      </div>

      {/* timer */}
      <div className="flex-none flex flex-col items-center">
        {!answered && (
          <CountdownTimer
            seconds={questionTimeout}
            key={questionIndex}
          />
        )}
      </div>

      {/* opponent life */}
      <div className="flex-1 text-right overflow-hidden">
        <div className="max-w-[12ch] truncate inline-block">
          <LifeCard entry={opponentLifeEntry} size="lg" />
        </div>
      </div>
    </header>
  );
}

import { COLORS } from "./theme.jsx";

// The warning strip every module shows when progress can't be saved, or
// couldn't be loaded (in which case saving is switched off for the session so
// a failed read can never overwrite real progress with an empty one).
export default function StorageNotice({ storageOk, loadFailed }) {
  if (storageOk && !loadFailed) return null;
  return (
    <div className="w-full max-w-md mx-auto px-5 mb-2" role="alert">
      <div className="text-xs px-3 py-2 rounded-lg" style={{ background: COLORS.hardSoft, color: COLORS.warnText }}>
        {loadFailed
          ? "Couldn't load your saved progress, so nothing will be saved this session (to protect what you already have). Check your connection and reload the page."
          : "Progress isn't saving right now — it may be lost if you reload."}
      </div>
    </div>
  );
}

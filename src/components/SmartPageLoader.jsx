import "./SmartPageLoader.css";

/** Non-blocking, accessible loading placeholder shared by route and data views. */
export default function SmartPageLoader({ label = "Loading information...", compact = false }) {
  return (
    <div className={`smart-page-loader${compact ? " smart-page-loader--compact" : ""}`} role="status" aria-live="polite" aria-label={label}>
      <div className="smart-page-loader__accent" aria-hidden="true" />
      <div className="smart-page-loader__head">
        <span className="smart-page-loader__pulse" aria-hidden="true"><i/><i/><i/></span>
        <span>{label}</span>
      </div>
      {!compact && <div className="smart-page-loader__skeleton" aria-hidden="true">
        <div className="smart-page-loader__line smart-page-loader__line--large" />
        <div className="smart-page-loader__grid"><span/><span/><span/></div>
        <div className="smart-page-loader__line smart-page-loader__line--short" />
      </div>}
    </div>
  );
}

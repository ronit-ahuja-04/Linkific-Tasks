/**
 * Shared breadcrumb + title + status pill used by every new Day 7 page.
 * Day 5 stations keep their own built-in headers.
 */
export default function PageHeader({ breadcrumb, title, pill, children }) {
  return (
    <>
      <div className="station-breadcrumb">CONTROL ROOM / {breadcrumb}</div>
      <div className="station-header">
        <div className="station-title-row">
          <h1 className="station-title">{title}</h1>
          {pill && (
            <span className="live-status-pill">
              <span className="pulse-dot" aria-hidden="true" />
              <span>{pill}</span>
            </span>
          )}
        </div>
        {children}
      </div>
    </>
  );
}

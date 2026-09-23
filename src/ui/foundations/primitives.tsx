import type { ReactNode } from "react";

export function PageWidth({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`page-width ${className}`.trim()}>{children}</div>;
}

export function PageHeading({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return (
    <header className="page-heading">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {description && <p className="page-heading__description">{description}</p>}
    </header>
  );
}

export function PrimaryLink({ href, children }: { href: string; children: ReactNode }) {
  return <a className="button button--primary" href={href}>{children}</a>;
}

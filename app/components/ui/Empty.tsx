// Empty primitive: the calm "nothing here yet" state for ops screens.
import type { ReactNode } from "react";

type EmptyProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function Empty({ icon = "◦", title, description, action }: EmptyProps) {
  return (
    <div className="ui-empty">
      <span className="ui-empty-icon" aria-hidden="true">{icon}</span>
      <b>{title}</b>
      {description && <p>{description}</p>}
      {action && <div className="ui-empty-action">{action}</div>}
    </div>
  );
}

import { Link } from "react-router";
import type { Provider, Workspace } from "@shared/types.ts";
import { useI18n, withLocale } from "../i18n/context.tsx";
import { api } from "../lib/api.ts";
import { Icon } from "../lib/icons.tsx";

export function AdminEntryControls({
  admin,
  provider,
  compact,
  onWorkspace,
  onEdit,
  onRemove,
}: {
  admin: boolean;
  provider: Provider;
  compact?: boolean;
  onWorkspace: (workspace: Workspace, message: string) => void;
  onEdit?: () => void;
  onRemove?: () => void;
}) {
  const { t, locale } = useI18n();
  if (!admin) return null;

  async function moderate(flags: { verified?: boolean; hidden?: boolean }, message: string) {
    onWorkspace((await api.moderateProvider(provider.id, flags)).workspace, message);
  }

  async function remove() {
    if (onRemove) {
      onRemove();
      return;
    }
    if (!window.confirm(t("confirm.trash", { name: provider.name }))) return;
    onWorkspace((await api.trashProvider(provider.id)).workspace, t("toasts.trashed", { name: provider.name }));
  }

  return (
    <div className={`admin-entry-controls${compact ? " is-compact" : ""}`}>
      <button
        className={`icon-btn${provider.verified ? " is-verified-btn" : ""}`}
        type="button"
        title={provider.verified ? t("admin.unverify") : t("admin.verify")}
        onClick={() => { void moderate({ verified: !provider.verified }, provider.verified ? t("toasts.unverified", { name: provider.name }) : t("toasts.verified", { name: provider.name })); }}
      >
        <Icon name="badgeCheck" />
      </button>
      <button
        className="icon-btn"
        type="button"
        title={provider.hidden ? t("admin.unhide") : t("admin.hide")}
        onClick={() => { void moderate({ hidden: !provider.hidden }, provider.hidden ? t("toasts.shown", { name: provider.name }) : t("toasts.hidden", { name: provider.name })); }}
      >
        <Icon name={provider.hidden ? "eye" : "eyeOff"} />
      </button>
      {onEdit ? (
        <button className="icon-btn" type="button" title={t("detail.edit")} onClick={onEdit}>
          <Icon name="edit" />
        </button>
      ) : (
        <Link className="icon-btn" to={withLocale(locale, `/entry/${provider.id}`)} title={t("detail.edit")}>
          <Icon name="edit" />
        </Link>
      )}
      <button className="icon-btn danger" type="button" title={t("confirm.trashAction")} onClick={() => { void remove(); }}>
        <Icon name="trash" />
      </button>
    </div>
  );
}

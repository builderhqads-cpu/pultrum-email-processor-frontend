/**
 * Renovo-only access to the cost/audit reports (Renato 2026-10-05). The real
 * per-e-mail cost is Renovo's margin, so the report is restricted to an
 * allowlist of e-mails. This mirrors the backend RenovoAdminGuard (which is the
 * real gate — this is only to hide the nav/page from everyone else).
 *
 * Keep in sync with AUDIT_ADMIN_EMAILS on the backend.
 */
const AUDIT_ADMIN_EMAILS = [
  'admin@renovoia.local',
  'contact@evoluicomia.com.br'
];

export function isAuditAdmin(email?: string | null): boolean {
  if (!email) return false;
  return AUDIT_ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

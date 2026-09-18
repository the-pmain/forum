import { useEffect, useState, type FormEvent } from "react";
import { commentPlainText, looksLikeHtml, sanitizeCommentHtml } from "@shared/commentHtml.ts";
import { COMMENT_NAME_KEY } from "@shared/constants.ts";
import type { EntryComment } from "@shared/types.ts";
import { useI18n } from "../i18n/context.tsx";
import { api } from "../lib/api.ts";
import { Icon } from "../lib/icons.tsx";
import { initials } from "../lib/utils.ts";
import { CommentEditor } from "./CommentEditor.tsx";

function readSavedName(): string {
  if (typeof localStorage === "undefined") return "";
  return localStorage.getItem(COMMENT_NAME_KEY)?.trim() || "";
}

function displayWhen(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function CommentBody({ body }: { body: string }) {
  if (!looksLikeHtml(body)) return <p>{body}</p>;
  return <div className="comment-html" dangerouslySetInnerHTML={{ __html: sanitizeCommentHtml(body) }} />;
}

export function CommentSection({ slug, countrySlug }: { slug: string; countrySlug?: string }) {
  const { t } = useI18n();
  const savedName = readSavedName();
  const [comments, setComments] = useState<EntryComment[]>([]);
  const [name, setName] = useState(savedName);
  const [locked, setLocked] = useState(Boolean(savedName));
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const textLength = commentPlainText(body).length;
  const canPost = name.trim().length >= 2 && textLength >= 2 && textLength <= 2000;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.comments(slug)
      .then((data) => {
        if (!cancelled) setComments(data.comments);
      })
      .catch(() => {
        if (!cancelled) setError(t("comments.loadError"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, t]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await api.addComment(slug, { name, body: sanitizeCommentHtml(body), countrySlug });
      setComments((list) => [data.comment, ...list]);
      setBody("");
      localStorage.setItem(COMMENT_NAME_KEY, data.comment.author_name);
      setName(data.comment.author_name);
      setLocked(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("comments.postError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="comment-section" aria-labelledby="entry-comments-title">
      <header className="comment-head">
        <div>
          <div className="eyebrow">{t("comments.eyebrow")}</div>
          <h2 id="entry-comments-title">{t("comments.title")}</h2>
        </div>
        <span className="comment-count">{t("comments.count", { count: comments.length })}</span>
      </header>

      {loading ? <p className="comment-empty">{t("comments.loading")}</p> : null}
      {!loading && comments.length === 0 ? <p className="comment-empty">{t("comments.empty")}</p> : null}

      <ol className="comment-list">
        {comments.map((comment) => (
          <li key={comment.id} className="comment-item">
            <div className="avatar">{initials(comment.author_name)}</div>
            <div>
              <div className="comment-meta">
                <strong>{comment.author_name}</strong>
                <time dateTime={comment.created_at}>{displayWhen(comment.created_at)}</time>
              </div>
              <CommentBody body={comment.body} />
            </div>
          </li>
        ))}
      </ol>

      <form className="comment-form" onSubmit={submit}>
        <div className="comment-form-title">{t("comments.write")}</div>
        <label className="comment-field">
          <span>{t("comments.name")}</span>
          <div className="comment-name-row">
            <input
              name="author"
              autoComplete="nickname"
              maxLength={80}
              value={name}
              disabled={locked}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("comments.namePlaceholder")}
            />
            {locked ? (
              <button className="btn" type="button" onClick={() => setLocked(false)}>
                <Icon name="unlock" />{t("comments.unlock")}
              </button>
            ) : name && readSavedName() ? (
              <button className="btn" type="button" onClick={() => { setName(readSavedName()); setLocked(true); }}>
                <Icon name="lock" />{t("comments.lock")}
              </button>
            ) : null}
          </div>
        </label>
        <div className="comment-field">
          <span>{t("comments.body")}</span>
          <CommentEditor value={body} onChange={setBody} placeholder={t("comments.bodyPlaceholder")} />
          <span className={`comment-counter${textLength > 2000 ? " is-over" : ""}`}>{t("comments.chars", { count: textLength })}</span>
        </div>
        {error ? <p className="comment-error" role="alert">{error}</p> : null}
        <div className="comment-actions">
          <button className="btn btn-primary" type="submit" disabled={submitting || !canPost}>
            {submitting ? t("comments.sending") : t("comments.submit")}
          </button>
          <p className="comment-hint">{locked ? t("comments.lockedHint") : t("comments.hint")}</p>
        </div>
      </form>
    </section>
  );
}

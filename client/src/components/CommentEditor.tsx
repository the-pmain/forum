import { useEffect, useRef } from "react";
import { commentPlainText } from "@shared/commentHtml.ts";
import { useI18n } from "../i18n/context.tsx";
import { Icon } from "../lib/icons.tsx";

const COMMANDS = [
  { command: "bold", icon: "bold", labelKey: "comments.bold" },
  { command: "italic", icon: "italic", labelKey: "comments.italic" },
  { command: "underline", icon: "underline", labelKey: "comments.underline" },
  { command: "insertUnorderedList", icon: "list", labelKey: "comments.bullets" },
  { command: "insertOrderedList", icon: "listOl", labelKey: "comments.numbered" },
] as const;

export function CommentEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder: string;
}) {
  const { t } = useI18n();
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = editorRef.current;
    if (!node) return;
    if (!value && node.innerHTML !== "") node.innerHTML = "";
  }, [value]);

  function emit() {
    onChange(editorRef.current?.innerHTML || "");
  }

  function run(command: string) {
    editorRef.current?.focus();
    document.execCommand(command, false);
    emit();
  }

  function addLink() {
    const href = window.prompt(t("comments.linkPrompt"), "https://");
    if (!href) return;
    editorRef.current?.focus();
    document.execCommand("createLink", false, href.trim());
    emit();
  }

  return (
    <div className="comment-editor">
      <div className="comment-toolbar" role="toolbar" aria-label={t("comments.toolbar")}>
        {COMMANDS.map((item) => (
          <button key={item.command} className="comment-tool" type="button" title={t(item.labelKey)} aria-label={t(item.labelKey)} onMouseDown={(event) => event.preventDefault()} onClick={() => run(item.command)}>
            <Icon name={item.icon} />
          </button>
        ))}
        <button className="comment-tool" type="button" title={t("comments.link")} aria-label={t("comments.link")} onMouseDown={(event) => event.preventDefault()} onClick={addLink}>
          <Icon name="link" />
        </button>
      </div>
      <div
        ref={editorRef}
        className="comment-composer"
        contentEditable
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        data-empty={commentPlainText(value) ? "false" : "true"}
        onInput={emit}
        onPaste={(event) => {
          event.preventDefault();
          const text = event.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, text);
          emit();
        }}
      />
    </div>
  );
}

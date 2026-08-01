"use client";

import { useMemo, useState } from "react";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useTrexo } from "@/lib/store";
import { formatRelative } from "@/lib/utils";
import type { Comment } from "@/lib/types";

export function CommentSection({ taskId }: { taskId: string }) {
  const comments = useTrexo((s) => s.comments);
  const user = useTrexo((s) => s.user);
  const addComment = useTrexo((s) => s.addComment);
  const deleteComment = useTrexo((s) => s.deleteComment);

  const [text, setText] = useState("");

  const taskComments = useMemo(
    () =>
      comments
        .filter((c) => c.taskId === taskId)
        .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)),
    [comments, taskId]
  );

  const submit = () => {
    if (!text.trim()) return;
    addComment(taskId, text.trim());
    setText("");
  };

  const authorOf = (c: Comment) =>
    c.userId === user?.id
      ? { name: user.name, color: user.avatarColor, self: true }
      : { name: "Anggota Tim", color: "#64748b", self: false };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <MessageSquare className="h-4 w-4 text-slate-400" />
        Komentar
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500">
          {taskComments.length}
        </span>
      </h3>

      <div className="space-y-4">
        {taskComments.length === 0 && (
          <p className="py-2 text-center text-sm text-slate-400">
            Belum ada komentar. Mulai catat progres di sini.
          </p>
        )}
        {taskComments.map((c) => {
          const author = authorOf(c);
          return (
            <div key={c.id} className="group flex gap-3">
              <Avatar name={author.name} color={author.color} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-800">{author.name}</span>
                  <span className="text-xs text-slate-400">{formatRelative(c.createdAt)}</span>
                  {author.self && (
                    <button
                      onClick={() => deleteComment(c.id)}
                      className="ml-auto rounded p-1 text-slate-300 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100"
                      aria-label="Hapus komentar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="mt-1 rounded-2xl rounded-tl-sm bg-slate-100/70 px-3 py-2 text-sm text-slate-700">
                  {c.content}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Composer */}
      <div className="mt-4 flex gap-3">
        <Avatar name={user?.name ?? "A"} color={user?.avatarColor} size="sm" />
        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                submit();
              }
            }}
            rows={2}
            placeholder="Tulis komentar… (Ctrl+Enter untuk kirim)"
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
          />
          <div className="mt-2 flex justify-end">
            <Button size="sm" onClick={submit} disabled={!text.trim()}>
              <Send className="h-3.5 w-3.5" />
              Kirim
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

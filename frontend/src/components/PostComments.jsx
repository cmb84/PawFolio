import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { apiUrl } from "../lib/api";

export default function PostComments({ postId }) {
  const { user, apiFetch } = useAuth();
  const navigate = useNavigate();

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const canPost = !!user;

  const placeholder = useMemo(() => {
    if (!user) return "Sign in to comment…";
    return "Add a comment…";
  }, [user]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(apiUrl(`/api/comments/${postId}?limit=120`));
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data?.comments)) {
        setComments(data.comments);
      } else {
        setComments([]);
      }
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!postId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  async function submit(e) {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }

    const body = text.trim();
    if (!body) return;

    setPosting(true);
    setError("");
    try {
      const data = await apiFetch(`/api/comments/${postId}`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });

      if (data?.comment) {
        setComments((c) => [...c, data.comment]);
        setText("");
      } else {
        await load();
        setText("");
      }
    } catch (err) {
      setError(err?.message || "Failed to add comment");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="comments">
      <div className="comments-header">
        <div className="comments-title">Comments</div>
        {loading ? <div className="comments-sub">Loading…</div> : null}
      </div>

      <div className="comments-list" aria-live="polite">
        {loading ? null : comments.length === 0 ? (
          <div className="comments-empty">No comments yet.</div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="comment">
              <div className="comment-head">
                <Link className="byline-link" to={`/u/${c.user?.username || ""}`}>@{c.user?.username || "user"}</Link>
                <span className="comment-time">
                  {c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
                </span>
              </div>
              <div className="comment-body">{c.body}</div>
            </div>
          ))
        )}
      </div>

      {error ? <div className="comments-error">{error}</div> : null}

      <form className="comment-form" onSubmit={submit}>
        <input
          className="comment-input"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          disabled={!canPost || posting}
          maxLength={1000}
        />
        {user ? (
          <button className="btn btn-cta" type="submit" disabled={posting || !text.trim()}>
            {posting ? "Posting…" : "Post"}
          </button>
        ) : (
          <button className="btn" type="button" onClick={() => navigate("/login")}>Log in</button>
        )}
      </form>
    </div>
  );
}

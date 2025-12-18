import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../lib/api";

const EMOJIS = [
  { key: "heart", label: "❤️" },
  { key: "paw", label: "🐾" },
  { key: "fire", label: "🔥" },
  { key: "laugh", label: "😂" },
  { key: "shock", label: "😲" },
  { key: "clap", label: "👏" },
];

export default function EmojiReactions({ postId }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  /* ---------- Load reactions from backend ---------- */
  async function loadReactions() {
    try {
      const res = await fetch(apiUrl(`/api/reactions/${postId}`));
      const data = await res.json();

      if (res.ok && data?.counts) {
        setCounts(data.counts);
      }
    } catch {
      // ignore silently
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  /* ---------- Toggle reaction ---------- */
  async function handleReact(emojiKey) {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      await fetch(apiUrl(`/api/reactions/${postId}`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ emoji: emojiKey }),
      });

      // 🔁 Re-fetch shared counts after update
      await loadReactions();
    } catch (err) {
      console.error("Reaction failed:", err);
    }
  }

  if (loading) {
    return null;
  }

  return (
    <div className="emoji-reactions" data-post-id={postId}>
      {EMOJIS.map((e) => (
        <button
          key={e.key}
          className="emoji-btn"
          onClick={() => handleReact(e.key)}
          disabled={!user}
          title={user ? "React" : "Sign in to react"}
        >
          <span className="emoji">{e.label}</span>
          <span className="emoji-count">{counts[e.key] || 0}</span>
        </button>
      ))}
    </div>
  );
}
import { useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useNavigate } from "react-router-dom";

const EMOJIS = [
  { key: "heart", label: "❤️" },
  { key: "paw", label: "🐾" },
  { key: "fire", label: "🔥" },
  { key: "laugh", label: "😂" },
  { key: "shock", label: "😲" },
  { key: "clap", label: "👏" },
];

export default function EmojiReactions() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // total counts
  const [counts, setCounts] = useState(() =>
    EMOJIS.reduce((acc, e) => {
      acc[e.key] = 0;
      return acc;
    }, {})
  );

  // track THIS user's reactions (session-based)
  const [userReactions, setUserReactions] = useState({});

  function handleReact(key) {
    if (!user) {
      navigate("/login");
      return;
    }

    setCounts((prev) => ({
      ...prev,
      [key]: prev[key] + (userReactions[key] ? -1 : 1),
    }));

    setUserReactions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  return (
    <div className="emoji-reactions">
      {EMOJIS.map((e) => {
        const active = userReactions[e.key];

        return (
          <button
            key={e.key}
            className={`emoji-btn ${active ? "active" : ""}`}
            onClick={() => handleReact(e.key)}
            disabled={!user}
            title={
              user
                ? "React"
                : "Sign in to react"
            }
          >
            <span className="emoji">{e.label}</span>
            <span className="emoji-count">{counts[e.key]}</span>
          </button>
        );
      })}
    </div>
  );
}
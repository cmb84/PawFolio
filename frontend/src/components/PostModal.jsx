import { Link } from "react-router-dom";
import { apiUrl } from "../lib/api";
import EmojiReactions from "./EmojiReactions";
import PostComments from "./PostComments";

export default function PostModal({ post, onClose }) {
  if (!post) return null;

  const username = post?.user?.username || "";
  const titleName = post?.petName || post?.pet_name || "Pet";
  const species = post?.species || "";
  const caption = post?.caption || "";
  const createdAt = post?.createdAt || post?.created_at || null;

  const img = apiUrl(post?.imagePath || post?.imageUrl || "");

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-x" type="button" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="modal-body">
          <div className="modal-media">
            <img src={img} alt={titleName} className="modal-img" />
          </div>

          <div className="modal-info">
            <div className="modal-header">
              <div className="modal-title">
                {titleName} {species ? <span className="badge">{species}</span> : null}
              </div>
              {username ? (
                <div className="modal-byline">
                  by <Link className="byline-link" to={`/u/${username}`}>@{username}</Link>
                </div>
              ) : null}
            </div>

            {caption ? <p className="modal-caption">{caption}</p> : null}

            <div className="modal-meta">
              <span className="muted">Posted:</span>{" "}
              {createdAt ? new Date(createdAt).toLocaleString() : "—"}
            </div>

            {/* Reactions + comments */}
            {post?.id ? <EmojiReactions postId={post.id} /> : null}
            {post?.id ? <PostComments postId={post.id} /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

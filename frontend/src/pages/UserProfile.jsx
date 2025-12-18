import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiUrl } from "../lib/api";
import { useAuth } from "../auth/AuthProvider";
import PostModal from "../components/PostModal";

function initials(name) {
  const n = (name || "").trim();
  if (!n) return "U";
  return n[0].toUpperCase();
}

export default function UserProfile() {
  const { user: authUser, loading, apiFetch } = useAuth();
  const { username: routeUsername } = useParams();
  const nav = useNavigate();

  const username = routeUsername || authUser?.username || "";
  const isOwnProfile = !!authUser && username && authUser.username === username;

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({ postCount: 0, followerCount: 0, followingCount: 0, isFollowing: false });
  const [error, setError] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [openPost, setOpenPost] = useState(null);

  useEffect(() => {
    if (!routeUsername && !loading && !authUser) {
      // /profile without auth would be unreachable because it's protected,
      // but keep this as a safe guard.
      nav("/login", { replace: true });
    }
  }, [routeUsername, loading, authUser, nav]);

  useEffect(() => {
    if (!username) return;

    let cancelled = false;
    setLoadingProfile(true);
    setError("");

    (async () => {
      try {
        const data = await apiFetch(`/api/users/${encodeURIComponent(username)}?limit=60`);

        if (cancelled) return;

        setProfile(data.user);
        setPosts(Array.isArray(data.posts) ? data.posts : []);
        setStats(
          data.stats || { postCount: 0, followerCount: 0, followingCount: 0, isFollowing: false }
        );
      } catch (err) {
        if (!cancelled) setError(err?.message || "Failed to load profile");
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [username, apiFetch]);

  const canFollow = !!authUser && !!profile && !isOwnProfile;

  async function toggleFollow() {
    if (!canFollow) return;

    try {
      if (stats.isFollowing) {
        await apiFetch(`/api/users/${encodeURIComponent(username)}/follow`, { method: "DELETE" });
        setStats((s) => ({
          ...s,
          isFollowing: false,
          followerCount: Math.max(0, (s.followerCount || 0) - 1),
        }));
      } else {
        await apiFetch(`/api/users/${encodeURIComponent(username)}/follow`, { method: "POST" });
        setStats((s) => ({
          ...s,
          isFollowing: true,
          followerCount: (s.followerCount || 0) + 1,
        }));
      }
    } catch (e) {
      setError(e?.message || "Follow action failed");
    }
  }

  const postImageSrc = (p) => apiUrl(p?.imagePath || p?.imageUrl || "");

  const title = useMemo(() => {
    if (profile?.username) return `@${profile.username}`;
    if (username) return `@${username}`;
    return "Profile";
  }, [profile, username]);

  if (!username) {
    return (
      <main className="page">
        <header className="hero profile-hero">
          <div className="container">
            <h1 className="hero-title">Profile</h1>
            <p className="hero-sub">No user selected.</p>
          </div>
        </header>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="hero profile-hero">
        <div className="container">
          <h1 className="hero-title">
            {title} <span className="accent">PawFolio</span>
          </h1>
          <p className="hero-sub">
            Public profile — share this link: <span className="mono">/u/{username}</span>
          </p>
        </div>
      </header>

      <section className="container" style={{ marginTop: 22, marginBottom: 28 }}>
        {loadingProfile ? (
          <div className="section-note">Loading profile…</div>
        ) : error ? (
          <div className="error-card">
            <div className="error-title">Couldn’t load this profile</div>
            <div className="error-text">{error}</div>
            <div style={{ marginTop: 12 }}>
              <Link className="btn btn-cta" to="/">Back Home</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="profile-header">
              <div className="profile-avatar" aria-hidden="true">
                {initials(profile?.username || username)}
              </div>

              <div className="profile-info">
                <div className="profile-top">
                  <div className="profile-name">@{profile?.username || username}</div>

                  <div className="profile-actions">
                    {isOwnProfile ? (
  <>
                  <Link className="btn btn-cta" to="/upload">
                   + New Post
                    </Link>
                   <Link className="btn btn-ghost" to="/settings">
                   Settings
                  </Link>
                 </>
                ) : canFollow ? (

                      <button className="btn btn-cta" onClick={toggleFollow}>
                        {stats?.isFollowing ? "Unfollow" : "Follow"}
                      </button>
                    ) : authUser ? null : (
                      <Link className="btn" to="/login">
                        Log in to follow
                      </Link>
                    )}
                  </div>
                </div>

                <div className="profile-stats">
                  <div className="stat">
                    <div className="stat-num">{stats?.postCount ?? posts.length}</div>
                    <div className="stat-label">posts</div>
                  </div>
                  <div className="stat">
                    <div className="stat-num">{stats?.followerCount ?? 0}</div>
                    <div className="stat-label">followers</div>
                  </div>
                  <div className="stat">
                    <div className="stat-num">{stats?.followingCount ?? 0}</div>
                    <div className="stat-label">following</div>
                  </div>
                </div>

                <div className="profile-bio">
                  <span className="badge">🐾 PawFolio</span>
                  <span className="bio-text">
                    Pet posts by @{profile?.username || username}. Click any photo to view details.
                  </span>
                </div>
              </div>
            </div>

            <div className="profile-divider" />

            {posts.length === 0 ? (
              <div className="section-note">
                No posts yet. {isOwnProfile ? <Link to="/upload">Upload the first one →</Link> : null}
              </div>
            ) : (
              <div className="ig-grid">
                {posts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="ig-tile"
                    onClick={() => setOpenPost(p)}
                    title={`${p.petName} (${p.species})`}
                  >
                    <img src={postImageSrc(p)} alt={p.petName} className="ig-tile-img" loading="lazy" />
                    <div className="ig-tile-overlay">
                      <div className="ig-tile-title">{p.petName}</div>
                      <div className="ig-tile-sub">{p.species}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <PostModal post={openPost} onClose={() => setOpenPost(null)} />
    </main>
  );
}

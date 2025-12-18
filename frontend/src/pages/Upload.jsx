import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../lib/api";
import { useAuth } from "../auth/AuthProvider";

const SPECIES = [
  "Dog",
  "Cat",
  "Hamster",
  "Bird",
  "Rabbit",
  "Reptile",
  "Fish",
  "Other",
];

export default function Upload() {
  const { user } = useAuth();
  const nav = useNavigate();

  const [file, setFile] = useState(null);
  const [petName, setPetName] = useState("");
  const [species, setSpecies] = useState("Cat");
  const [caption, setCaption] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const previewUrl = useMemo(() => {
    if (!file) return "";
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFileChange(e) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/heic",
      "image/heif",
    ];

    if (!allowedTypes.includes(selected.type)) {
      setMessage("Invalid file type. Please upload a JPG, PNG, GIF, HEIC, or HEIF.");
      setFile(null);
      return;
    }

    setFile(selected);
    setMessage("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return setMessage("Please choose an image.");
    if (!petName.trim()) return setMessage("Please enter your pet's name.");

    setSubmitting(true);
    setMessage("");

    const formData = new FormData();
    formData.append("image", file);
    formData.append("petName", petName.trim());
    formData.append("species", species.trim());
    formData.append("caption", caption.trim());

    try {
      const token = localStorage.getItem("pawfolio_token");

      const res = await fetch(apiUrl("/api/posts"), {
        method: "POST",
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Upload failed");

      setMessage("Uploaded! 🎉");
      // Instagram-y flow: go back to your profile to see your new post.
      nav(`/u/${user.username}`);
    } catch (err) {
      setMessage(err?.message || "Upload failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page">
      <header className="hero profile-hero">
        <div className="container">
          <h1 className="hero-title">
            New Post <span className="accent">(Upload)</span>
          </h1>
          <p className="hero-sub">
            Share your pet with the world{user?.username ? ` as @${user.username}` : ""}.
          </p>
        </div>
      </header>

      <section className="container" style={{ marginTop: 22, marginBottom: 28 }}>
        <div className="upload-card">
          <div className="upload-preview">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="upload-preview-img" />
            ) : (
              <div className="upload-preview-empty">
                <div className="upload-preview-icon">📷</div>
                <div className="upload-preview-text">Choose a photo to preview it here</div>
              </div>
            )}
          </div>

          <form className="upload-form" onSubmit={handleSubmit}>
            <label className="form-row">
              <span className="form-label">Photo</span>
              <input
                className="form-input"
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.heic,.heif"
                onChange={handleFileChange}
              />
            </label>

            <label className="form-row">
              <span className="form-label">Pet name</span>
              <input
                className="form-input"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                placeholder="e.g., Momo"
              />
            </label>

            <label className="form-row">
              <span className="form-label">Species</span>
              <select
                className="form-input"
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
              >
                {SPECIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-row">
              <span className="form-label">Caption</span>
              <textarea
                className="form-textarea"
                rows={4}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Tell us something cute, funny, or chaotic… 🐾"
              />
            </label>

            <div className="upload-actions">
              <button className="btn btn-cta" type="submit" disabled={submitting}>
                {submitting ? "Uploading…" : "Post"}
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => nav(user?.username ? `/u/${user.username}` : "/")}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>

            {message ? <div className="form-message">{message}</div> : null}
          </form>
        </div>
      </section>
    </main>
  );
}

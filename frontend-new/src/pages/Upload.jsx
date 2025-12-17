import { useState } from "react";
import { apiUrl } from "../lib/api";
import { useAuth } from "../auth/AuthProvider";

export default function Upload() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

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
      setMessage("Invalid file type.");
      setFile(null);
      return;
    }

    setFile(selected);
    setMessage("");
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const token = localStorage.getItem("pawfolio_token");

      const res = await fetch(apiUrl("/api/upload"), {
        method: "POST",
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Upload failed");

      setMessage(data?.message || "Upload successful!");
      setFile(null);
    } catch (err) {
      setMessage(err?.message || "Upload failed.");
    }
  }

  return (
    <main className="min-h-screen flex justify-center bg-slate-950 text-slate-100 px-4 py-8">
      <section className="w-full max-w-xl bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-xl">
        <h1 className="text-2xl font-bold mb-2">Upload</h1>
        <p className="text-slate-300 mb-6">
          Upload an image{user?.username ? ` as ${user.username}` : ""}.
        </p>

        <form onSubmit={handleUpload}>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.gif,.heic,.heif"
            onChange={handleFileChange}
          />
          <div style={{ height: 12 }} />
          <button type="submit" className="btn btn-cta" disabled={!file}>
            Upload
          </button>
        </form>

        {message && <p style={{ marginTop: 12 }}>{message}</p>}
      </section>
    </main>
  );
}

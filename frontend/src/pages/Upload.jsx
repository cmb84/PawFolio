import { useState } from "react";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  function handleFileChange(e) {
    const selected = e.target.files[0];
    if (!selected) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/heic",
      "image/heif"
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
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error("Upload failed");

      setMessage("Upload successful!");
      setFile(null);
    } catch (err) {
      setMessage("Upload failed.");
    }
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Upload Image</h2>

      <form onSubmit={handleUpload}>
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.gif,.heic,.heif"
          onChange={handleFileChange}
        />
        <br /><br />
        <button type="submit" disabled={!file}>
          Upload
        </button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}
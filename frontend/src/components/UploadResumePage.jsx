import { useState } from "react";
import { useUploadResumeMutation } from "../reducers/api/userApiSlice";

export default function UploadResumePage() {
  const [uploadResume, { isLoading }] = useUploadResumeMutation();

  const [pdf, setPdf] = useState(null);
  const [tex, setTex] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!pdf || !tex) {
      setError("Please select both a PDF and a .tex file.");
      return;
    }

    try {
      const response = await uploadResume({
        pdf,
        tex,
      }).unwrap();

      setSuccess(response.message || "Resume uploaded successfully!");
    } catch (err) {
      setError(err?.data?.detail || "Failed to upload resume.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">
            Upload Resume
          </h1>

          <p className="mt-2 text-sm text-zinc-400">
            Upload your resume PDF along with the corresponding LaTeX source
            file.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Resume PDF
            </label>

            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setPdf(e.target.files[0])}
              className="block w-full cursor-pointer rounded-lg border border-zinc-700 bg-zinc-800 text-sm text-zinc-300 file:mr-4 file:cursor-pointer file:border-0 file:bg-blue-600 file:px-4 file:py-3 file:text-white hover:file:bg-blue-500"
            />

            {pdf && (
              <p className="mt-2 text-sm text-zinc-400">
                {pdf.name}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              LaTeX (.tex) File
            </label>

            <input
              type="file"
              accept=".tex"
              onChange={(e) => setTex(e.target.files[0])}
              className="block w-full cursor-pointer rounded-lg border border-zinc-700 bg-zinc-800 text-sm text-zinc-300 file:mr-4 file:cursor-pointer file:border-0 file:bg-blue-600 file:px-4 file:py-3 file:text-white hover:file:bg-blue-500"
            />

            {tex && (
              <p className="mt-2 text-sm text-zinc-400">
                {tex.name}
              </p>
            )}
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-400">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Uploading..." : "Upload Resume"}
          </button>
        </form>
      </div>
    </div>
  );
}
import { useState } from "react";
import {
  useCheckATSScoreMutation,
  useOptimizeResumeMutation,
} from "../reducers/api/userApiSlice";
import { useDispatch, useSelector } from "react-redux";
import { setCredentials } from "../store/authSlice";
import { UserRound } from "lucide-react";
import { Link } from "react-router-dom";

const ATS_PROMPT = `You are an skilled ATS (Applicant Tracking System) scanner with a deep understanding of software engineering.
Your task is to evaluate the resume against the provided job description.

Give me the percentage of match if the resume matches the job description.

The output should follow exactly this structure:

Match Percentage:
<percentage>

Missing Keywords:
- keyword 1
- keyword 2
- keyword 3

Final Thoughts:
<overall evaluation and suggestions>.`;

export default function HomePage() {
  const dispatch = useDispatch();
  const username = useSelector((state) => state.auth.username);

  const logout = () => {
    dispatch(
      setCredentials({
        token: null,
        username: null,
      }),
    );
  };

  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState(null);
  const [mode, setMode] = useState("");

  const [checkATSScore, { isLoading: atsLoading }] = useCheckATSScoreMutation();

  const [optimizeResume, { isLoading: optimizeLoading }] =
    useOptimizeResumeMutation();

  const handleATS = async () => {
    if (!jobDescription.trim()) return;

    try {
      setMode("ats");

      const res = await checkATSScore({
        job_description: jobDescription,
        ai_prompt: ATS_PROMPT,
      }).unwrap();

      setResult(res.response);
    } catch (err) {
      setResult(err?.data?.detail || "Something went wrong.");
    }
  };

  const handleOptimize = async () => {
    if (!jobDescription.trim()) return;

    try {
      setMode("optimize");

      const res = await optimizeResume({
        job_description: jobDescription,
      }).unwrap();

      setResult(res);
    } catch (err) {
      setResult(err?.data?.detail || "Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex justify-between items-center w-full">
          <div>
            <h1 className="text-4xl font-bold text-white">
              ResumeIQ
            </h1>

            <p className="mt-2 text-zinc-400">
              Paste a job description below and either evaluate your resume or
              optimize it for the role.
            </p>
          </div>
          <div className="w-max flex items-center gap-6">
            <Link
              to="/upload-resume"
              className="text-white flex gap-2 items-center hover:opacity-65 cursor-pointer"
            >
              <UserRound />
              <p>{username}</p>
            </Link>
            <button
              onClick={logout}
              className="text-white bg-red-500 p-4 py-2 rounded-2xl cursor-pointer hover:opacity-65"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
          <label className="mb-3 block text-sm font-medium text-zinc-300">
            Job Description
          </label>

          <textarea
            rows={14}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the complete job description here..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-4 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
          />

          <div className="mt-6 flex flex-wrap gap-4">
            <button
              onClick={handleATS}
              disabled={atsLoading || optimizeLoading}
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {atsLoading ? "Checking..." : "Get ATS Score"}
            </button>

            <button
              onClick={handleOptimize}
              disabled={atsLoading || optimizeLoading}
              className="rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {optimizeLoading ? "Optimizing..." : "Optimize Resume"}
            </button>
          </div>
        </div>

        {result && (
          <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <h2 className="mb-6 text-2xl font-bold text-white">
              {mode === "ats" ? "ATS Analysis" : "Optimized Resume"}
            </h2>

            {mode === "ats" ? (
              <pre className="whitespace-pre-wrap wrap-break-word font-sans text-zinc-300">
                {result}
              </pre>
            ) : (
              <div className="space-y-6 text-zinc-300">
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-white">
                    ATS Score Before
                  </h3>
                  <p>{result.ats_score_before}%</p>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-semibold text-white">
                    Estimated ATS Score After
                  </h3>
                  <p>{result.estimated_ats_score_after}%</p>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-semibold text-white">
                    Summary
                  </h3>
                  <p>{result.summary}</p>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-semibold text-white">
                    Changes Made
                  </h3>

                  <ul className="list-disc space-y-2 pl-6">
                    {result.changes_made?.map((change, index) => (
                      <li key={index}>{change}</li>
                    ))}
                  </ul>
                </div>

                {result.missing_skills?.length > 0 && (
                  <div>
                    <h3 className="mb-4 text-lg font-semibold text-white">
                      Missing Skills
                    </h3>

                    <div className="space-y-4">
                      {result.missing_skills.map((skill, index) => (
                        <div
                          key={index}
                          className="rounded-lg border border-zinc-700 bg-zinc-800 p-4"
                        >
                          <p>
                            <span className="font-semibold text-white">
                              Skill:
                            </span>{" "}
                            {skill.skill}
                          </p>

                          <p>
                            <span className="font-semibold text-white">
                              Importance:
                            </span>{" "}
                            {skill.importance}
                          </p>

                          <p>
                            <span className="font-semibold text-white">
                              Reason:
                            </span>{" "}
                            {skill.reason}
                          </p>

                          <p>
                            <span className="font-semibold text-white">
                              Suggestion:
                            </span>{" "}
                            {skill.suggestion}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="mb-2 text-lg font-semibold text-white">
                    Optimized LaTeX Resume
                  </h3>

                  <textarea
                    readOnly
                    value={result.updated_latex}
                    rows={18}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-4 font-mono text-sm text-zinc-300"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

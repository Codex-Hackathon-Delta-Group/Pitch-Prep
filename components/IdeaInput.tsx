"use client";

import { useRef, useState } from "react";
import { AUDIENCES, type Audience } from "@/lib/contracts";

const labels: Record<Audience, string> = {
  hackathon_judges: "Hackathon judges",
  investors: "Investors",
  partners: "Partners or teammates",
  first_customers: "First customers",
};

type Props = {
  idea: string;
  audience: Audience;
  busy: boolean;
  onIdeaChange: (value: string) => void;
  onAudienceChange: (value: Audience) => void;
  onSubmit: () => void;
};

const example = "Non-technical people often have promising ideas but do not know how to research competitors, identify weaknesses, ask the right product questions, or turn the result into a convincing pitch. Pitch Prep researches similar solutions, challenges the user with focused questions, recommends an improved concept for approval, and creates a 60-second pitch, a one-page HTML presentation, and likely audience questions with honest answers.";

export function AudienceSelect({ value, onChange, disabled = false }: { value: Audience; onChange: (value: Audience) => void; disabled?: boolean }) {
  return <label className="field compact-field">
    <span>Pitching to</span>
    <select value={value} onChange={(event) => onChange(event.target.value as Audience)} disabled={disabled}>
      {AUDIENCES.map((item) => <option key={item} value={item}>{labels[item]}</option>)}
    </select>
  </label>;
}

export function IdeaInput({ idea, audience, busy, onIdeaChange, onAudienceChange, onSubmit }: Props) {
  const [fileError, setFileError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const trimmedLength = idea.trim().length;
  const validation = trimmedLength > 0 && trimmedLength < 50 ? "Add a little more detail—at least 50 characters." : trimmedLength > 12000 ? "Shorten the idea to 12,000 characters." : "";

  async function readFile(file?: File) {
    if (!file) return;
    setFileError("");
    const extension = file.name.toLowerCase().split(".").pop();
    if (!extension || !["txt", "md"].includes(extension)) return setFileError("Choose a .txt or .md file.");
    if (file.size > 1024 * 1024) return setFileError("The file must be 1 MB or smaller.");
    try {
      const text = new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer());
      onIdeaChange(text);
    } catch {
      setFileError("This file could not be read as UTF-8 text.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return <section className="input-panel" aria-labelledby="idea-heading">
    <div className="eyebrow">01 · Start with the rough version</div>
    <h2 id="idea-heading">What are you thinking about?</h2>
    <p className="guidance">In 3–10 sentences, describe the problem, who has it, your solution, and why it may be better. It’s fine not to know everything yet.</p>
    <label className="field">
      <span>Your idea</span>
      <textarea value={idea} onChange={(event) => onIdeaChange(event.target.value)} maxLength={12001} rows={10} placeholder="Paste the rough, unfinished version here…" aria-describedby="idea-help" />
    </label>
    <div id="idea-help" className="input-meta">
      <span className={validation ? "error-text" : ""}>{validation || fileError || "Your text stays editable throughout the setup."}</span>
      <span>{idea.length.toLocaleString()} / 12,000</span>
    </div>
    <div className="input-actions">
      <input ref={inputRef} className="visually-hidden" id="idea-file" type="file" accept=".txt,.md,text/plain,text/markdown" onChange={(event) => readFile(event.target.files?.[0])} />
      <label className="button secondary" htmlFor="idea-file">Upload .txt or .md</label>
      <button className="text-button" type="button" onClick={() => onIdeaChange(example)}>Use demo idea</button>
    </div>
    <div className="submit-row">
      <AudienceSelect value={audience} onChange={onAudienceChange} disabled={busy} />
      <button className="button primary" type="button" disabled={busy || Boolean(validation) || trimmedLength < 50} onClick={onSubmit}>
        {busy ? "Researching…" : "Research my idea"}<span aria-hidden="true">↗</span>
      </button>
    </div>
  </section>;
}

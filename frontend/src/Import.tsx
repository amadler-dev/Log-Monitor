import React from "react";

export type ParsedEvent = {
  time: string;
  ts: number;
  event: string;
  homepageLoaded: number;
  pageClosed: number;
  source?: string;
};

function sanitizeMaybeJson(text: string) {
  // remove BOM
  text = text.replace(/^\uFEFF/, "");
  // If file has leading non-JSON metadata lines (like "// filepath: ..."), strip lines starting with //
  text = text.replace(/^[ \t]*\/\/.*$/gm, "");
  // strip block comments
  text = text.replace(/\/\*[\s\S]*?\*\//g, "");
  // if there is garbage before the first { or [, cut it off (common when editor inserts a header)
  const first = text.search(/[{[]/);
  if (first > 0) text = text.slice(first);
  return text.trim();
}

export default function JsonImportButton({ onLoad }: { onLoad: (data: ParsedEvent[]) => void }) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const openFilePicker = () => fileInputRef.current?.click();

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    console.log("Importing files count:", files.length);

    const fileArr = Array.from(files);
    const results = await Promise.allSettled(
      fileArr.map(async (file) => {
        const text = await file.text();
        const clean = sanitizeMaybeJson(text);
        const obj = JSON.parse(clean) as Record<string, string>;
        const parsed: ParsedEvent[] = Object.entries(obj)
          .map(([time, ev]) => {
            const ts = Date.parse(time);
            return {
              time,
              ts,
              event: ev,
              homepageLoaded: ev === "homepage loaded" ? 1 : 0,
              pageClosed: ev === "page closed" ? 1 : 0,
              source: file.name,
            };
          })
          .filter(p => !Number.isNaN(p.ts));
        return { file: file.name, parsed };
      })
    );

    const allParsed: ParsedEvent[] = [];
    const errors: string[] = [];

    for (const r of results) {
      if (r.status === "fulfilled") {
        allParsed.push(...r.value.parsed);

        console.log(`Imported ${r.value.parsed.length} events from ${r.value.file}`);
        
      } else {
        console.error("Failed to parse a file:", r.reason);
        errors.push(String(r.reason?.message ?? r.reason ?? "Unknown error"));
      }
    }

    if (allParsed.length === 0 && errors.length > 0) {
      alert("No files imported. Errors:\n" + errors.join("\n"));
      return;
    }

    // sort and return
    allParsed.sort((a, b) => a.ts - b.ts);
    if (errors.length) {
      // non-blocking notification
      console.warn("Some files failed to parse. See console for details.");
      alert("Some files failed to parse. Check console for details.");
    }

    onLoad(allParsed);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        multiple
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <button onClick={openFilePicker}>Import JSON files</button>
    </>
  );
}
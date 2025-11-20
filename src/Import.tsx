import React from "react";

export type ParsedEvent = {
  time: string;
  ts: number;
  type: 'click' | 'page_view' | 'session_start' | 'session_end';
  url: string;
  page?: string;
  duration?: number;
  elementId?: string;
  elementText?: string;
  userAgent?: string;
  screenResolution?: string;
  source?: string;
};

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
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");

        const parsed: ParsedEvent[] = lines.map(line => {
          try {
            const obj = JSON.parse(line);
            const ts = Date.parse(obj.timestamp);
            return {
              time: obj.timestamp,
              ts,
              type: obj.type,
              url: obj.url,
              page: obj.page,
              duration: obj.duration,
              elementId: obj.elementId,
              elementText: obj.elementText,
              userAgent: obj.userAgent,
              screenResolution: obj.screenResolution,
              source: file.name,
            } as ParsedEvent;
          } catch (e) {
            console.error("Failed to parse line:", line, e);
            return null;
          }
        }).filter((p): p is ParsedEvent => p !== null && !Number.isNaN(p.ts));

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
        accept=".json,.jsonl"
        multiple
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <button onClick={openFilePicker}>Import JSON/JSONL files</button>
    </>
  );
}
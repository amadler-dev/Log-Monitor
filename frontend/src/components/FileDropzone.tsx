import React from "react";
import type { ParsedEvent } from "../utils/analytics";

export default function FileDropzone({ onLoad }: { onLoad: (data: ParsedEvent[]) => void }) {
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);
    const [isDragOver, setIsDragOver] = React.useState(false);

    const openFilePicker = () => fileInputRef.current?.click();

    const handleFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

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
            } else {
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
            alert("Some files failed to parse. Check console for details.");
        }

        onLoad(allParsed);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        handleFiles(e.dataTransfer.files);
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const onDragLeave = () => setIsDragOver(false);

    return (
        <div
            className={`file-dropzone ${isDragOver ? "drag-over" : ""}`}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={openFilePicker}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept=".json,.jsonl"
                multiple
                style={{ display: "none" }}
                onChange={handleFileChange}
            />
            <div className="dropzone-content">
                <p>Drag & Drop log files here</p>
                <span className="sub-text">or click to browse</span>
            </div>
        </div>
    );
}

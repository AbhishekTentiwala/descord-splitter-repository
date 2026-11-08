"use client";

import { FileIcon, X } from "lucide-react";
import Image from "next/image";
import { useUploadThing } from "@/lib/uploadthing-client";
import { useCallback, useState } from "react";

interface FileUploadProps {
  onChange: (url?: string) => void;
  value: string;
  endpoint: "messageFile" | "serverImage";
}

export const FileUpload = ({ onChange, value, endpoint }: FileUploadProps) => {
  const fileType = value?.split(".").pop();
  const [isUploading, setIsUploading] = useState(false);

  const { startUpload, isUploading: utUploading } = useUploadThing(endpoint, {
    onUploadError: (error) => {
      console.error("Upload error:", error);
      setIsUploading(false);
    },
    onClientUploadComplete: (res) => {
      setIsUploading(false);
      onChange(res?.[0].url);
    },
  });

  const handleFileSelect = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setIsUploading(true);
      try {
        await startUpload(files);
      } catch (error) {
        console.error("Upload failed:", error);
        setIsUploading(false);
      }
    },
    [startUpload]
  );

  if (value && endpoint === "messageFile") {
    return (
      <div className="relative flex items-center p-2 mt-2 rounded-md bg-background/10">
        <FileIcon className="h-10 w-10 fill-pink-200 stroke-pink-400" />
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 w-80 flex flex-wrap text-sm text-pink-500 dark:text-pink-400 hover:underline"
        >
          {value}
        </a>
        <button
          onClick={() => onChange("")}
          className="bg-rose-500 text-white p-1 rounded-full absolute -top-2 -right-2 shadow-sm"
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (value && fileType !== "pdf") {
    return (
      <>
        <div className="relative h-20 w-20">
          <Image fill src={value} alt="Upload" className="rounded-full" />
          <button
            onClick={() => onChange("")}
            className="bg-rose-500 text-white p-1 rounded-full absolute top-0 right-0 shadow-sm"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="w-80 h-60 flex flex-wrap">{value}</div>
      </>
    );
  }

  const uploading = isUploading || utUploading;

  return (
    <div
      className="border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
      onClick={() => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = endpoint === "serverImage" ? "image/*" : "image/*,application/pdf";
        input.onchange = (e) => {
          const files = Array.from((e.target as HTMLInputElement).files || []);
          handleFileSelect(files);
        };
        input.click();
      }}
    >
      <div className="flex flex-col items-center gap-2">
        <FileIcon className="h-12 w-12 text-zinc-400" />
        <p className="text-zinc-500 dark:text-zinc-400">
          {endpoint === "serverImage"
            ? "Click to upload server image"
            : "Click to upload file"}
        </p>
        <p className="text-xs text-zinc-400">
          {endpoint === "serverImage"
            ? "PNG/JPG up to 4MB"
            : "PNG/JPG/PDF up to 4MB"}
        </p>
        {uploading && (
          <div className="flex items-center gap-2 text-primary">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            <span>Uploading...</span>
          </div>
        )}
      </div>
    </div>
  );
};
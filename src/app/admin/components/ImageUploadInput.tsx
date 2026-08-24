"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { FiUploadCloud, FiTrash2, FiLink, FiImage, FiCheck, FiLoader } from "react-icons/fi";

type ImageUploadInputProps = {
  name: string;
  label: string;
  initialUrl?: string;
  disabled?: boolean;
  required?: boolean;
  aspectRatio?: "square" | "landscape" | "portrait";
};

export function ImageUploadInput({
  name,
  label,
  initialUrl = "",
  disabled = false,
  required = false,
  aspectRatio = "square",
}: ImageUploadInputProps) {
  const [url, setUrl] = useState<string>(initialUrl);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [useUrlMode, setUseUrlMode] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (.png, .jpg, .webp, .svg).");
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage(null);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Failed to upload image");
      }

      setUrl(data.url);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = () => {
    setUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <button
          type="button"
          onClick={() => setUseUrlMode(!useUrlMode)}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
        >
          {useUrlMode ? <FiImage className="h-3 w-3" /> : <FiLink className="h-3 w-3" />}
          {useUrlMode ? "Upload File" : "Paste URL"}
        </button>
      </div>

      {/* Hidden input to pass value in form submission */}
      <input type="hidden" name={name} value={url} />

      {useUrlMode ? (
        /* Direct URL input mode */
        <div className="space-y-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={disabled}
            placeholder="https://example.com/image.png or /uploads/..."
            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs font-semibold outline-none focus:border-blue-600 disabled:bg-slate-100"
          />
          {url && (
            <div className="relative inline-block h-20 w-20 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              <img src={url} alt="Preview" className="h-full w-full object-cover" />
            </div>
          )}
        </div>
      ) : url ? (
        /* Image Preview State */
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
          <div
            className={`relative overflow-hidden rounded-lg border border-slate-200 bg-white ${
              aspectRatio === "landscape"
                ? "h-16 w-28"
                : aspectRatio === "portrait"
                ? "h-20 w-16"
                : "h-16 w-16"
            }`}
          >
            <img src={url} alt="Uploaded preview" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-slate-800">
              {url.startsWith("http") ? url : url.split("/").pop()}
            </p>
            <p className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
              <FiCheck className="h-3.5 w-3.5" /> Image attached
            </p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            title="Remove image"
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
        </div>
      ) : (
        /* Drag & Drop Upload Zone */
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition ${
            isDragging
              ? "border-blue-600 bg-blue-50/50"
              : "border-slate-300 bg-slate-50/50 hover:border-slate-400 hover:bg-slate-50"
          } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={onFileChange}
            disabled={disabled || isUploading}
            className="hidden"
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-1 py-2 text-blue-600">
              <FiLoader className="h-6 w-6 animate-spin" />
              <span className="text-xs font-bold">Uploading file...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 py-1">
              <FiUploadCloud className="h-6 w-6 text-slate-400" />
              <p className="text-xs font-bold text-slate-700">
                Click to browse or drag &amp; drop image
              </p>
              <p className="text-[10px] font-medium text-slate-400">
                PNG, JPG, WEBP, or SVG (max 5MB)
              </p>
            </div>
          )}
        </div>
      )}

      {errorMessage && (
        <p className="text-[11px] font-bold text-red-600">{errorMessage}</p>
      )}
    </div>
  );
}

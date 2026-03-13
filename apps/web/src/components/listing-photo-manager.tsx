"use client";

import { useRef, useState, useCallback, DragEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { uploadPhotos, deletePhoto, reorderPhotos } from "@/lib/api/listings";
import type { MediaItem } from "@/lib/types";
import { getOriginalMediaUrl } from "@/lib/media";

const MAX_PHOTOS = 20;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

interface Props {
  listingId: string;
  initialPhotos: MediaItem[];
}

export default function ListingPhotoManager({ listingId, initialPhotos }: Props) {
  const router = useRouter();

  const [photos, setPhotos] = useState<MediaItem[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Which photo is pending inline confirmation before delete
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  // Which photo is actively being deleted (shows spinner overlay)
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Cover-set workflow: idle | saving | saved
  const [coverStatus, setCoverStatus] = useState<"idle" | "saving" | "saved">("idle");

  const [isDragOver, setIsDragOver] = useState(false);
  // Drag-to-reorder state
  const dragIndexRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Upload ────────────────────────────────────────────────────────────────

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      setUploadError(null);
      const arr = Array.from(files);
      if (arr.length === 0) return;

      const invalid = arr.find((f) => !ALLOWED_TYPES.includes(f.type));
      if (invalid) {
        setUploadError(
          `"${invalid.name}" geçersiz format. Yalnızca jpg, png, webp yükleniyor.`,
        );
        return;
      }
      const tooBig = arr.find((f) => f.size > MAX_SIZE_BYTES);
      if (tooBig) {
        setUploadError(`"${tooBig.name}" 10 MB sınırını aşıyor.`);
        return;
      }
      if (photos.length + arr.length > MAX_PHOTOS) {
        setUploadError(`Maksimum ${MAX_PHOTOS} fotoğraf yüklenebilir.`);
        return;
      }

      setUploading(true);
      try {
        const updated = await uploadPhotos(listingId, arr);
        setPhotos(updated);
        router.refresh(); // re-fetch RSC so public detail page reflects new photos
      } catch (err) {
        setUploadError(
          err instanceof Error ? err.message : "Yükleme başarısız.",
        );
      } finally {
        setUploading(false);
      }
    },
    [listingId, photos.length, router],
  );

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) handleFiles(e.target.files);
    e.target.value = "";
  }

  // ── Drop zone ─────────────────────────────────────────────────────────────

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  }
  function onDropZoneDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(true);
  }
  function onDragLeave() {
    setIsDragOver(false);
  }

  // ── Delete (with inline confirmation) ────────────────────────────────────

  function requestDelete(photoId: string) {
    setDeleteError(null);
    setConfirmDeleteId(photoId);
  }

  function cancelDelete() {
    setConfirmDeleteId(null);
  }

  async function confirmDelete(photoId: string) {
    setConfirmDeleteId(null);
    setDeleteError(null);
    setDeletingId(photoId);
    try {
      await deletePhoto(listingId, photoId);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      router.refresh();
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Silme başarısız.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  // ── Set as cover ──────────────────────────────────────────────────────────

  async function handleSetCover(photoId: string) {
    if (coverStatus === "saving") return;
    const idx = photos.findIndex((p) => p.id === photoId);
    if (idx <= 0) return;

    // Move target photo to the front, keep remaining order
    const reordered = [
      photos[idx],
      ...photos.slice(0, idx),
      ...photos.slice(idx + 1),
    ];
    const snapshot = photos; // keep snapshot for rollback
    setPhotos(reordered); // optimistic update
    setCoverStatus("saving");

    try {
      const updated = await reorderPhotos(
        listingId,
        reordered.map((p) => p.id),
      );
      setPhotos(updated);
      setCoverStatus("saved");
      router.refresh();
      setTimeout(() => setCoverStatus("idle"), 3000);
    } catch {
      setPhotos(snapshot); // revert on error
      setCoverStatus("idle");
    }
  }

  // ── Drag-to-reorder ───────────────────────────────────────────────────────

  function onThumbDragStart(index: number) {
    dragIndexRef.current = index;
  }

  function onThumbDragOver(e: DragEvent<HTMLDivElement>, index: number) {
    e.preventDefault();
    const from = dragIndexRef.current;
    if (from === null || from === index) return;
    setPhotos((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(index, 0, item);
      dragIndexRef.current = index;
      return next;
    });
  }

  async function onThumbDragEnd() {
    dragIndexRef.current = null;
    try {
      const updated = await reorderPhotos(
        listingId,
        photos.map((p) => p.id),
      );
      setPhotos(updated);
      router.refresh();
    } catch {
      // non-fatal — local order already applied visually
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Fotoğraf Yönetimi
        </h2>
        <div className="flex items-center gap-3">
          {coverStatus === "saved" && (
            <span className="text-xs font-medium text-green-600">
              Kapak güncellendi.
            </span>
          )}
          {coverStatus === "saving" && (
            <span className="animate-pulse text-xs text-zinc-400">
              Kaydediliyor…
            </span>
          )}
          <span className="text-xs text-zinc-400">
            {photos.length} / {MAX_PHOTOS}
          </span>
        </div>
      </div>

      {/* Drop zone */}
      {photos.length < MAX_PHOTOS && (
        <div
          onDrop={onDrop}
          onDragOver={onDropZoneDragOver}
          onDragLeave={onDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 cursor-pointer rounded-lg border-2 border-dashed p-8 text-sm transition-colors ${
            isDragOver
              ? "border-blue-400 bg-blue-50 text-blue-600"
              : "border-zinc-300 bg-zinc-50 text-zinc-500 hover:border-zinc-400 hover:bg-zinc-100"
          }`}
        >
          {uploading ? (
            <span className="animate-pulse">Yükleniyor…</span>
          ) : (
            <>
              <svg
                className="h-8 w-8 text-zinc-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              <span>Fotoğraf yüklemek için tıklayın veya sürükleyin</span>
              <span className="text-xs text-zinc-400">
                JPG, PNG, WEBP — maks. 10 MB
              </span>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={onInputChange}
          />
        </div>
      )}

      {/* Upload error */}
      {uploadError && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">
          {uploadError}
        </p>
      )}

      {/* Delete error */}
      {deleteError && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">
          {deleteError}
        </p>
      )}

      {/* Thumbnail grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {photos.map((photo, idx) => {
            const isConfirming = confirmDeleteId === photo.id;
            const isDeleting = deletingId === photo.id;

            return (
              <div
                key={photo.id}
                draggable={!isConfirming && !isDeleting}
                onDragStart={() => onThumbDragStart(idx)}
                onDragOver={(e) => onThumbDragOver(e, idx)}
                onDragEnd={onThumbDragEnd}
                className={`group relative aspect-square overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 ${
                  isConfirming || isDeleting
                    ? "cursor-default"
                    : "cursor-grab active:cursor-grabbing"
                }`}
              >
                {/* Photo */}
                <Image
                  src={getOriginalMediaUrl(photo)}
                  alt={`Fotoğraf ${idx + 1}`}
                  fill
                  sizes="(max-width: 640px) 33vw, 20vw"
                  className={`object-cover transition-opacity ${
                    isDeleting ? "opacity-30" : ""
                  }`}
                  unoptimized
                />

                {/* Cover badge */}
                {idx === 0 && !isConfirming && !isDeleting && (
                  <span className="absolute left-1 top-1 rounded bg-blue-600/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    Kapak
                  </span>
                )}

                {/* ── Inline delete confirmation overlay ─────────────── */}
                {isConfirming && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/75 p-2">
                    <p className="text-center text-[10px] font-medium leading-tight text-white">
                      Bu fotoğrafı silmek istediğinizden emin misiniz?
                    </p>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => confirmDelete(photo.id)}
                        className="rounded bg-red-600 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-red-700"
                      >
                        Sil
                      </button>
                      <button
                        type="button"
                        onClick={cancelDelete}
                        className="rounded bg-white/20 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-white/30"
                      >
                        İptal
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Deleting spinner overlay ─────────────────────────── */}
                {isDeleting && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span className="animate-pulse text-xs font-medium text-white">
                      Siliniyor…
                    </span>
                  </div>
                )}

                {/* ── Hover actions (hidden while confirming / deleting) ── */}
                {!isConfirming && !isDeleting && (
                  <>
                    {/* Delete — top-right */}
                    <button
                      type="button"
                      onClick={() => requestDelete(photo.id)}
                      aria-label="Fotoğrafı sil"
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>

                    {/* Set as cover — bottom-left, non-cover photos only */}
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => handleSetCover(photo.id)}
                        disabled={coverStatus === "saving"}
                        aria-label="Kapak olarak ayarla"
                        title="Kapak olarak ayarla"
                        className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        ★ Kapak
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {photos.length > 1 && (
        <p className="text-xs text-zinc-400">
          Sıralamak için sürükleyin · &quot;★ Kapak&quot; ile kapak fotoğrafını değiştirin
        </p>
      )}
    </div>
  );
}

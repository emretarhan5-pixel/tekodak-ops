"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import type {
  DeleteWorkOrderPhotoAction,
  GetWorkOrderPhotoUrlAction,
  UploadWorkOrderPhotoAction,
  WorkOrderPhotoItem,
} from "@/lib/api/work-orders/types";
import {
  WORK_ORDER_PHOTO_ACCEPT,
  WORK_ORDER_PHOTO_MAX_BYTES,
  WORK_ORDER_PHOTO_TYPES,
  getWorkOrderPhotoTypeLabel,
  type WorkOrderPhotoType,
} from "@/lib/constants/work-order-file";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
);

const inputClassName = cn(
  selectClassName,
  "min-h-0 py-2",
);

type WorkOrderPhotosProps = {
  workOrderId: string;
  photos: WorkOrderPhotoItem[];
  currentUserId: string;
  isAdmin: boolean;
  canEdit: boolean;
  uploadPhotoAction: UploadWorkOrderPhotoAction;
  deletePhotoAction: DeleteWorkOrderPhotoAction;
  getPhotoUrlAction: GetWorkOrderPhotoUrlAction;
};

function formatDate(value: string): string {
  try {
    return format(new Date(value), "d MMM yyyy HH:mm", { locale: tr });
  } catch {
    return "—";
  }
}

function PhotoGalleryItem({
  photo,
  canDelete,
  isDeleting,
  getPhotoUrlAction,
  onDelete,
  onPreview,
}: {
  photo: WorkOrderPhotoItem;
  canDelete: boolean;
  isDeleting: boolean;
  getPhotoUrlAction: GetWorkOrderPhotoUrlAction;
  onDelete: (id: string) => void;
  onPreview: (payload: { url: string; title: string; caption: string | null }) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void getPhotoUrlAction(photo.id)
      .then((result) => {
        if (!cancelled && result.success) {
          setUrl(result.data.url);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [photo.id, getPhotoUrlAction]);

  return (
    <figure className="group relative overflow-hidden rounded-lg border border-border bg-muted/30">
      <div className="relative aspect-[4/3] w-full">
        {loading ? (
          <div className="flex size-full items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <button
            type="button"
            className="size-full"
            onClick={() =>
              onPreview({
                url,
                title: getWorkOrderPhotoTypeLabel(photo.photo_type),
                caption: photo.caption ?? null,
              })
            }
          >
            <img
              src={url}
              alt={photo.caption ?? getWorkOrderPhotoTypeLabel(photo.photo_type)}
              className="size-full object-cover"
            />
          </button>
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
            Görüntü yüklenemedi
          </div>
        )}
      </div>
      <figcaption className="space-y-1 p-3 text-sm">
        <p className="font-medium">
          {getWorkOrderPhotoTypeLabel(photo.photo_type)}
        </p>
        {photo.caption ? (
          <p className="text-muted-foreground">{photo.caption}</p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          {photo.uploaded_by_name} · {formatDate(photo.taken_at)}
        </p>
      </figcaption>
      {canDelete ? (
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 size-8 opacity-90"
          disabled={isDeleting}
          onClick={() => onDelete(photo.id)}
        >
          {isDeleting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}
        </Button>
      ) : null}
    </figure>
  );
}

export function WorkOrderPhotos({
  workOrderId,
  photos,
  currentUserId,
  isAdmin,
  canEdit,
  uploadPhotoAction,
  deletePhotoAction,
  getPhotoUrlAction,
}: WorkOrderPhotosProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoType, setPhotoType] = useState<WorkOrderPhotoType>("during");
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    url: string;
    title: string;
    caption: string | null;
  } | null>(null);

  const resetUploadForm = useCallback(() => {
    setSelectedFile(null);
    setPhotoType("during");
    setCaption("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, []);

  function pickFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Yalnızca görsel dosyaları yüklenebilir");
      return;
    }
    if (file.size > WORK_ORDER_PHOTO_MAX_BYTES) {
      toast.error("Fotoğraf boyutu en fazla 10 MB olabilir");
      return;
    }
    setSelectedFile(file);
  }

  async function handleUpload() {
    if (!selectedFile) {
      toast.error("Lütfen bir fotoğraf seçin");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.set("workOrderId", workOrderId);
      formData.set("photoType", photoType);
      formData.set("caption", caption);
      formData.set("file", selectedFile);

      const result = await uploadPhotoAction(formData);

      if (!result.success) {
        toast.error(result.error ?? "Fotoğraf yüklenemedi");
        return;
      }

      toast.success("Fotoğraf yüklendi");
      setUploadOpen(false);
      resetUploadForm();
      router.refresh();
    } catch {
      toast.error("Beklenmeyen bir hata oluştu");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(photoId: string) {
    if (!window.confirm("Bu fotoğrafı silmek istediğinize emin misiniz?")) {
      return;
    }

    setDeletingId(photoId);
    try {
      const result = await deletePhotoAction(photoId);
      if (!result.success) {
        toast.error(result.error ?? "Fotoğraf silinemedi");
        return;
      }
      toast.success("Fotoğraf silindi");
      router.refresh();
    } catch {
      toast.error("Beklenmeyen bir hata oluştu");
    } finally {
      setDeletingId(null);
    }
  }

  function canDeletePhoto(photo: WorkOrderPhotoItem): boolean {
    return isAdmin || photo.uploaded_by === currentUserId;
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Fotoğraflar</CardTitle>
            <CardDescription>
              Saha fotoğrafları ve kanıt görselleri
            </CardDescription>
          </div>
          {canEdit ? (
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              onClick={() => setUploadOpen(true)}
            >
              <Plus className="size-4" />
              Fotoğraf Yükle
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-14 text-center">
              <ImagePlus className="size-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Henüz fotoğraf yüklenmedi
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {photos.map((photo) => (
                <PhotoGalleryItem
                  key={photo.id}
                  photo={photo}
                  canDelete={canDeletePhoto(photo)}
                  isDeleting={deletingId === photo.id}
                  getPhotoUrlAction={getPhotoUrlAction}
                  onDelete={(id) => void handleDelete(id)}
                  onPreview={(payload) => setPreview(payload)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fotoğraf yükle</DialogTitle>
            <DialogDescription>
              JPEG, PNG veya WebP — en fazla 10 MB
            </DialogDescription>
          </DialogHeader>

          <Field>
            <FieldLabel>Fotoğraf *</FieldLabel>
            <input
              ref={inputRef}
              type="file"
              accept={WORK_ORDER_PHOTO_ACCEPT}
              className="text-sm"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="wo-photo-type">Tür *</FieldLabel>
            <select
              id="wo-photo-type"
              className={selectClassName}
              value={photoType}
              onChange={(e) =>
                setPhotoType(e.target.value as WorkOrderPhotoType)
              }
            >
              {WORK_ORDER_PHOTO_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>

          <Field>
            <FieldLabel htmlFor="wo-photo-caption">Açıklama</FieldLabel>
            <input
              id="wo-photo-caption"
              className={inputClassName}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setUploadOpen(false);
                resetUploadForm();
              }}
              disabled={isUploading}
            >
              Vazgeç
            </Button>
            <Button
              type="button"
              disabled={!selectedFile || isUploading}
              onClick={() => void handleUpload()}
            >
              {isUploading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Yükleniyor…
                </>
              ) : (
                "Yükle"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(preview)} onOpenChange={() => setPreview(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{preview?.title ?? "Fotoğraf"}</DialogTitle>
            {preview?.caption ? (
              <DialogDescription>{preview.caption}</DialogDescription>
            ) : null}
          </DialogHeader>
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview.url}
              alt={preview.caption ?? preview.title}
              className="max-h-[70vh] w-full rounded-md object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

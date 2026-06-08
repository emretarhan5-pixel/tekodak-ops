"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  DeleteServiceRequestPhotoAction,
  GetServiceRequestPhotoUrlAction,
  ServiceRequestPhotoItem,
  UploadServiceRequestPhotoAction,
} from "@/lib/api/service-requests/types";
import type { ServiceRequestPhotoStep } from "@/lib/constants/service-request";
import { SERVICE_REQUEST_PHOTO_MAX_BYTES } from "@/lib/constants/service-request-photo";
import { cn } from "@/lib/utils";

const IMAGE_ACCEPT = "image/*";

type ServiceRequestPhotosProps = {
  serviceRequestId: string;
  step: ServiceRequestPhotoStep;
  photos: ServiceRequestPhotoItem[];
  canEdit: boolean;
  uploadPhotoAction: UploadServiceRequestPhotoAction;
  deletePhotoAction: DeleteServiceRequestPhotoAction;
  getPhotoUrlAction: GetServiceRequestPhotoUrlAction;
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
  photo: ServiceRequestPhotoItem;
  canDelete: boolean;
  isDeleting: boolean;
  getPhotoUrlAction: GetServiceRequestPhotoUrlAction;
  onDelete: (id: string) => void;
  onPreview: (payload: { url: string; title: string }) => void;
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
          <button
            type="button"
            className="size-full"
            onClick={() =>
              onPreview({
                url,
                title: photo.file_name,
              })
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={photo.file_name}
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
        <p className="truncate font-medium">{photo.file_name}</p>
        <p className="text-xs text-muted-foreground">
          {photo.uploaded_by_name} · {formatDate(photo.created_at)}
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

export function ServiceRequestPhotos({
  serviceRequestId,
  step,
  photos,
  canEdit,
  uploadPhotoAction,
  deletePhotoAction,
  getPhotoUrlAction,
}: ServiceRequestPhotosProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(
    null,
  );

  const stepPhotos = photos.filter((photo) => photo.step === step);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileList = Array.from(files);
      if (fileList.length === 0) return;

      setIsUploading(true);
      let successCount = 0;

      try {
        for (const file of fileList) {
          if (!file.type.startsWith("image/")) {
            toast.error(`${file.name}: Yalnızca görsel dosyaları yüklenebilir`);
            continue;
          }
          if (file.size > SERVICE_REQUEST_PHOTO_MAX_BYTES) {
            toast.error(`${file.name}: Dosya boyutu en fazla 10 MB olabilir`);
            continue;
          }

          const formData = new FormData();
          formData.set("file", file);
          formData.set("serviceRequestId", serviceRequestId);
          formData.set("step", String(step));

          const result = await uploadPhotoAction(formData);
          if (result.success) {
            successCount += 1;
          } else {
            toast.error(result.error);
          }
        }

        if (successCount > 0) {
          toast.success(
            successCount === 1
              ? "Fotoğraf yüklendi"
              : `${successCount} fotoğraf yüklendi`,
          );
          router.refresh();
        }
      } finally {
        setIsUploading(false);
        if (inputRef.current) {
          inputRef.current.value = "";
        }
      }
    },
    [router, serviceRequestId, step, uploadPhotoAction],
  );

  async function handleDelete(photoId: string) {
    if (!window.confirm("Bu fotoğrafı silmek istediğinize emin misiniz?")) {
      return;
    }

    setDeletingId(photoId);
    try {
      const result = await deletePhotoAction(photoId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Fotoğraf silindi");
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {canEdit ? (
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              inputRef.current?.click();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            void uploadFiles(event.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50",
            isUploading && "pointer-events-none opacity-70",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={IMAGE_ACCEPT}
            multiple
            className="sr-only"
            disabled={isUploading}
            onChange={(event) => {
              if (event.target.files) {
                void uploadFiles(event.target.files);
              }
            }}
          />
          {isUploading ? (
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          ) : (
            <ImagePlus className="size-8 text-muted-foreground" />
          )}
          <div className="space-y-1">
            <p className="text-sm font-medium">
              Fotoğraf eklemek için dokunun veya sürükleyin
            </p>
            <p className="text-xs text-muted-foreground">
              Birden fazla görsel seçebilirsiniz (maks. 10 MB)
            </p>
          </div>
        </div>
      ) : null}

      {stepPhotos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz fotoğraf yok.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {stepPhotos.map((photo) => (
            <PhotoGalleryItem
              key={photo.id}
              photo={photo}
              canDelete={canEdit}
              isDeleting={deletingId === photo.id}
              getPhotoUrlAction={getPhotoUrlAction}
              onDelete={(id) => void handleDelete(id)}
              onPreview={setPreview}
            />
          ))}
        </div>
      )}

      <Dialog open={preview != null} onOpenChange={() => setPreview(null)}>
        <DialogContent className="max-w-3xl p-0">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle>{preview?.title}</DialogTitle>
          </DialogHeader>
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview.url}
              alt={preview.title}
              className="max-h-[70vh] w-full object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

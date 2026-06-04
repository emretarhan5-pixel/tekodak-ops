"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Download,
  FileUp,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  DeleteWorkOrderFileAction,
  GetWorkOrderFileDownloadUrlAction,
  UploadWorkOrderFileAction,
  WorkOrderFileItem,
} from "@/lib/api/work-orders/types";
import {
  WORK_ORDER_FILE_CATEGORIES,
  WORK_ORDER_FILE_CATEGORY_ORDER,
  WORK_ORDER_FILE_MAX_BYTES,
  getWorkOrderFileCategoryLabel,
  type WorkOrderFileCategory,
} from "@/lib/constants/work-order-file";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
);

const textareaClassName = cn(
  selectClassName,
  "min-h-[72px] resize-y py-2.5",
);

type WorkOrderFilesProps = {
  workOrderId: string;
  files: WorkOrderFileItem[];
  currentUserId: string;
  isAdmin: boolean;
  canEdit: boolean;
  uploadFileAction: UploadWorkOrderFileAction;
  deleteFileAction: DeleteWorkOrderFileAction;
  getDownloadUrlAction: GetWorkOrderFileDownloadUrlAction;
};

function formatDate(value: string): string {
  try {
    return format(new Date(value), "d MMM yyyy HH:mm", { locale: tr });
  } catch {
    return "—";
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function groupFilesByCategory(files: WorkOrderFileItem[]) {
  const groups = new Map<string, WorkOrderFileItem[]>();
  for (const file of files) {
    const key = file.category ?? "other";
    const list = groups.get(key) ?? [];
    list.push(file);
    groups.set(key, list);
  }

  const ordered: Array<{ category: string; label: string; files: WorkOrderFileItem[] }> =
    [];

  for (const cat of WORK_ORDER_FILE_CATEGORY_ORDER) {
    const list = groups.get(cat);
    if (list?.length) {
      ordered.push({
        category: cat,
        label: getWorkOrderFileCategoryLabel(cat),
        files: list,
      });
      groups.delete(cat);
    }
  }

  for (const [category, list] of groups.entries()) {
    if (list.length > 0) {
      ordered.push({
        category,
        label: getWorkOrderFileCategoryLabel(category),
        files: list,
      });
    }
  }

  return ordered;
}

export function WorkOrderFiles({
  workOrderId,
  files,
  currentUserId,
  isAdmin,
  canEdit,
  uploadFileAction,
  deleteFileAction,
  getDownloadUrlAction,
}: WorkOrderFilesProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<WorkOrderFileCategory>("other");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const grouped = useMemo(() => groupFilesByCategory(files), [files]);

  const resetUploadForm = useCallback(() => {
    setSelectedFile(null);
    setCategory("other");
    setDescription("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, []);

  function pickFile(file: File | null) {
    if (!file) return;
    if (file.size > WORK_ORDER_FILE_MAX_BYTES) {
      toast.error("Dosya boyutu en fazla 10 MB olabilir");
      return;
    }
    setSelectedFile(file);
  }

  async function handleUpload() {
    if (!selectedFile) {
      toast.error("Lütfen bir dosya seçin");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.set("workOrderId", workOrderId);
      formData.set("category", category);
      formData.set("description", description);
      formData.set("file", selectedFile);

      const result = await uploadFileAction(formData);

      if (!result.success) {
        toast.error(result.error ?? "Dosya yüklenemedi");
        return;
      }

      toast.success("Dosya yüklendi");
      setUploadOpen(false);
      resetUploadForm();
      router.refresh();
    } catch {
      toast.error("Beklenmeyen bir hata oluştu");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDownload(fileId: string) {
    setDownloadingId(fileId);
    try {
      const result = await getDownloadUrlAction(fileId);
      if (!result.success) {
        toast.error(result.error ?? "İndirme başarısız");
        return;
      }
      window.open(result.data.url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Beklenmeyen bir hata oluştu");
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDelete(fileId: string) {
    if (!window.confirm("Bu dosyayı silmek istediğinize emin misiniz?")) {
      return;
    }

    setDeletingId(fileId);
    try {
      const result = await deleteFileAction(fileId);
      if (!result.success) {
        toast.error(result.error ?? "Dosya silinemedi");
        return;
      }
      toast.success("Dosya silindi");
      router.refresh();
    } catch {
      toast.error("Beklenmeyen bir hata oluştu");
    } finally {
      setDeletingId(null);
    }
  }

  function canDeleteFile(file: WorkOrderFileItem): boolean {
    return isAdmin || file.uploaded_by === currentUserId;
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Dosyalar</CardTitle>
            <CardDescription>
              İş emrine ait belgeler (en fazla 10 MB)
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
              Dosya Yükle
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-14 text-center">
              <FileUp className="size-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Henüz dosya yüklenmedi
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map((group) => (
                <div key={group.category}>
                  <h3 className="mb-2 text-sm font-medium">{group.label}</h3>
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Dosya</TableHead>
                          <TableHead>Boyut</TableHead>
                          <TableHead>Yükleyen</TableHead>
                          <TableHead>Tarih</TableHead>
                          <TableHead className="text-right">İşlem</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.files.map((file) => (
                          <TableRow key={file.id}>
                            <TableCell>
                              <p className="font-medium">{file.file_name}</p>
                              {file.description ? (
                                <p className="text-xs text-muted-foreground">
                                  {file.description}
                                </p>
                              ) : null}
                            </TableCell>
                            <TableCell className="text-sm tabular-nums">
                              {formatFileSize(file.file_size_bytes)}
                            </TableCell>
                            <TableCell className="text-sm">
                              {file.uploaded_by_name}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                              {formatDate(file.uploaded_at)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  disabled={downloadingId === file.id}
                                  onClick={() => void handleDownload(file.id)}
                                >
                                  {downloadingId === file.id ? (
                                    <Loader2 className="size-4 animate-spin" />
                                  ) : (
                                    <Download className="size-4" />
                                  )}
                                </Button>
                                {canDeleteFile(file) ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive"
                                    disabled={deletingId === file.id}
                                    onClick={() => void handleDelete(file.id)}
                                  >
                                    {deletingId === file.id ? (
                                      <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="size-4" />
                                    )}
                                  </Button>
                                ) : null}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dosya yükle</DialogTitle>
            <DialogDescription>En fazla 10 MB</DialogDescription>
          </DialogHeader>

          <Field>
            <FieldLabel>Dosya *</FieldLabel>
            <input
              ref={inputRef}
              type="file"
              className="text-sm"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
            {selectedFile ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </p>
            ) : null}
          </Field>

          <Field>
            <FieldLabel htmlFor="wo-file-category">Kategori *</FieldLabel>
            <select
              id="wo-file-category"
              className={selectClassName}
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as WorkOrderFileCategory)
              }
            >
              {WORK_ORDER_FILE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>

          <Field>
            <FieldLabel htmlFor="wo-file-desc">Açıklama</FieldLabel>
            <textarea
              id="wo-file-desc"
              className={textareaClassName}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
    </>
  );
}

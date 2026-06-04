"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Download,
  FileUp,
  Loader2,
  Plus,
  Trash2,
  Upload,
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
  ContractFileRow,
  DeleteContractFileAction,
  GetContractFileDownloadUrlAction,
  UploadContractFileAction,
} from "@/lib/api/contracts/types";
import {
  CONTRACT_FILE_CATEGORIES,
  CONTRACT_FILE_CATEGORY_ORDER,
  CONTRACT_FILE_MAX_BYTES,
  getContractFileCategoryLabel,
  type ContractFileCategory,
} from "@/lib/constants/contract-file";
import { cn } from "@/lib/utils";

type ContractFilesProps = {
  contractId: string;
  files: ContractFileRow[];
  currentUserId: string;
  isAdmin: boolean;
  canEdit: boolean;
  uploadFileAction: UploadContractFileAction;
  deleteFileAction: DeleteContractFileAction;
  getDownloadUrlAction: GetContractFileDownloadUrlAction;
};

const selectClassName = cn(
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
);

const textareaClassName = cn(
  selectClassName,
  "min-h-[72px] resize-y py-2.5",
);

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string): string {
  try {
    return format(new Date(value), "d MMM yyyy HH:mm", { locale: tr });
  } catch {
    return "—";
  }
}

function groupFilesByCategory(files: ContractFileRow[]) {
  const groups = new Map<string, ContractFileRow[]>();

  for (const file of files) {
    const key = file.category ?? "other";
    const list = groups.get(key) ?? [];
    list.push(file);
    groups.set(key, list);
  }

  const ordered: Array<{
    category: string;
    label: string;
    files: ContractFileRow[];
  }> = [];

  for (const cat of CONTRACT_FILE_CATEGORY_ORDER) {
    const list = groups.get(cat);
    if (list?.length) {
      ordered.push({
        category: cat,
        label: getContractFileCategoryLabel(cat),
        files: list,
      });
      groups.delete(cat);
    }
  }

  for (const [category, list] of groups.entries()) {
    if (list.length > 0) {
      ordered.push({
        category,
        label: getContractFileCategoryLabel(category),
        files: list,
      });
    }
  }

  return ordered;
}

export function ContractFiles({
  contractId,
  files,
  currentUserId,
  isAdmin,
  canEdit,
  uploadFileAction,
  deleteFileAction,
  getDownloadUrlAction,
}: ContractFilesProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<ContractFileCategory>(
    "signed_contract",
  );
  const [description, setDescription] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const grouped = useMemo(() => groupFilesByCategory(files), [files]);

  const resetUploadForm = useCallback(() => {
    setSelectedFile(null);
    setCategory("signed_contract");
    setDescription("");
    setUploadProgress(0);
    setIsDragging(false);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, []);

  function pickFile(file: File | null) {
    if (!file) return;
    if (file.size > CONTRACT_FILE_MAX_BYTES) {
      toast.error("Dosya boyutu en fazla 10 MB olabilir");
      return;
    }
    setSelectedFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    pickFile(file ?? null);
  }

  async function handleUpload() {
    if (!selectedFile) {
      toast.error("Lütfen bir dosya seçin");
      return;
    }

    setIsUploading(true);
    setUploadProgress(15);

    const progressTimer = window.setInterval(() => {
      setUploadProgress((p) => (p < 85 ? p + 8 : p));
    }, 200);

    try {
      const formData = new FormData();
      formData.set("contractId", contractId);
      formData.set("category", category);
      formData.set("description", description);
      formData.set("file", selectedFile);

      const result = await uploadFileAction(formData);

      window.clearInterval(progressTimer);

      if (!result.success) {
        toast.error(result.error ?? "Dosya yüklenemedi");
        setUploadProgress(0);
        return;
      }

      setUploadProgress(100);
      toast.success("Dosya yüklendi");
      setUploadOpen(false);
      resetUploadForm();
      router.refresh();
    } catch {
      window.clearInterval(progressTimer);
      toast.error("Beklenmeyen bir hata oluştu");
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
      window.setTimeout(() => setUploadProgress(0), 400);
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
    if (
      !window.confirm(
        "Bu dosyayı silmek istediğinize emin misiniz? Kayıt soft delete ile kaldırılır.",
      )
    ) {
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

  function canDeleteFile(file: ContractFileRow): boolean {
    return isAdmin || file.uploaded_by === currentUserId;
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Dosyalar</CardTitle>
            <CardDescription>
              Sözleşmeye ait belgeler (en fazla 10 MB)
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
              <div>
                <p className="font-medium">Henüz dosya yok</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  İmzalı sözleşme, ek protokol veya fatura yükleyin.
                </p>
              </div>
              {canEdit ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setUploadOpen(true)}
                >
                  <Upload className="size-4" />
                  İlk dosyayı yükle
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="space-y-8">
              {grouped.map((group) => (
                <section key={group.category} className="space-y-3">
                  <h3 className="text-sm font-semibold">{group.label}</h3>
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Dosya adı</TableHead>
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
                              <div>
                                <p className="font-medium">{file.file_name}</p>
                                {file.description ? (
                                  <p className="text-xs text-muted-foreground">
                                    {file.description}
                                  </p>
                                ) : null}
                              </div>
                            </TableCell>
                            <TableCell>
                              {formatFileSize(file.file_size_bytes)}
                            </TableCell>
                            <TableCell>{file.uploaded_by_name}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDate(file.uploaded_at)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 gap-1"
                                  disabled={downloadingId === file.id}
                                  onClick={() => handleDownload(file.id)}
                                >
                                  {downloadingId === file.id ? (
                                    <Loader2 className="size-4 animate-spin" />
                                  ) : (
                                    <Download className="size-4" />
                                  )}
                                  İndir
                                </Button>
                                {canDeleteFile(file) ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 gap-1 text-destructive hover:text-destructive"
                                    disabled={deletingId === file.id}
                                    onClick={() => handleDelete(file.id)}
                                  >
                                    {deletingId === file.id ? (
                                      <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="size-4" />
                                    )}
                                    Sil
                                  </Button>
                                ) : null}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </section>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {canEdit ? (
        <Dialog
          open={uploadOpen}
          onOpenChange={(open) => {
            setUploadOpen(open);
            if (!open && !isUploading) {
              resetUploadForm();
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Dosya yükle</DialogTitle>
              <DialogDescription>
                PDF, Office veya görsel dosyalar (maks. 10 MB)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    inputRef.current?.click();
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-10 text-center transition-colors",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50",
                )}
              >
                <Upload className="size-8 text-muted-foreground" />
                {selectedFile ? (
                  <>
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium">
                      Sürükleyip bırakın veya tıklayın
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Maksimum 10 MB
                    </p>
                  </>
                )}
                <input
                  ref={inputRef}
                  type="file"
                  className="sr-only"
                  onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                />
              </div>

              <Field>
                <FieldLabel htmlFor="contract-file-category">Kategori</FieldLabel>
                <select
                  id="contract-file-category"
                  className={selectClassName}
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as ContractFileCategory)
                  }
                  disabled={isUploading}
                >
                  {CONTRACT_FILE_CATEGORIES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field>
                <FieldLabel htmlFor="contract-file-description">
                  Açıklama (opsiyonel)
                </FieldLabel>
                <textarea
                  id="contract-file-description"
                  className={textareaClassName}
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isUploading}
                />
              </Field>

              {isUploading || uploadProgress > 0 ? (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Yükleniyor…</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isUploading}
                onClick={() => setUploadOpen(false)}
              >
                İptal
              </Button>
              <Button
                type="button"
                disabled={!selectedFile || isUploading}
                onClick={handleUpload}
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
      ) : null}
    </>
  );
}

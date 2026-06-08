"use client";

import { ArrowRight, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type OnboardingModalProps = {
  open: boolean;
  onStartTour: () => void;
  onDismiss: () => void;
};

export function OnboardingModal({
  open,
  onStartTour,
  onDismiss,
}: OnboardingModalProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onDismiss()}>
      <DialogContent
        className="onboarding-modal-enter max-w-md text-center sm:text-center"
        showCloseButton={false}
      >
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 shadow-lg">
          <Wrench className="size-8 text-white" aria-hidden />
        </div>

        <DialogHeader className="items-center gap-3 pr-0 text-center">
          <p className="text-xs font-semibold tracking-widest text-orange-600 uppercase">
            TEKODAK OPS
          </p>
          <DialogTitle className="text-xl">
            TEKODAK OPS&apos;a Hoş Geldiniz! 🎉
          </DialogTitle>
          <p className="text-sm font-medium text-foreground">
            Sistemi birkaç adımda tanıyalım.
          </p>
          <DialogDescription className="text-center">
            Bu kısa tur sana sistemin nasıl çalıştığını gösterecek. İstediğin
            zaman atlayabilir veya daha sonra tekrar açabilirsin.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-2 flex-col gap-2 sm:flex-col">
          <Button type="button" className="w-full gap-2" onClick={onStartTour}>
            Turu Başlat
            <ArrowRight className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={onDismiss}
          >
            Şimdi Değil
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

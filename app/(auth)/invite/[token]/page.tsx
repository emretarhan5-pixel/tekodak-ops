import Link from "next/link";

import { AuthBrand } from "@/components/auth/auth-brand";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type InvitePageProps = {
  params: Promise<{ token: string }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;

  return (
    <Card className="w-full max-w-md border-border/60 shadow-lg">
      <CardHeader className="border-b border-border/60 pb-6">
        <AuthBrand subtitle="Davet ile katılım" />
        <CardTitle className="text-center text-lg">Davet Kabul</CardTitle>
        <CardDescription className="text-center">
          Bu özellik sonraki sürümde tamamlanacaktır
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Davet bağlantınız alındı. Hesap oluşturma ve şifre belirleme akışı
          PROMPT 3 sonrası ayrı bir adımda eklenecektir.
        </p>
        <p className="rounded-md bg-muted px-3 py-2 font-mono text-xs text-muted-foreground break-all">
          {token}
        </p>
        <Link
          href="/login"
          className={cn(buttonVariants(), "inline-flex h-10 w-full")}
        >
          Giriş sayfasına dön
        </Link>
      </CardContent>
    </Card>
  );
}

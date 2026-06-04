import { Card, CardContent } from "@/components/ui/card";

type ModuleSkeletonPageProps = {
  title: string;
  promptNumber: number;
  footerNote?: string;
};

export function ModuleSkeletonPage({
  title,
  promptNumber,
  footerNote,
}: ModuleSkeletonPageProps) {
  return (
    <div>
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="mt-2 text-muted-foreground">
        Bu modül PROMPT {promptNumber}&apos;te tamamlanacak
      </p>
      <Card className="mt-6">
        <CardContent className="p-6">
          <p>Yapım aşamasında...</p>
          {footerNote ? (
            <p className="mt-3 text-sm text-muted-foreground">{footerNote}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

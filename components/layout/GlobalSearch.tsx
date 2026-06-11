"use client";

import {
  FileText,
  Loader2,
  Printer,
  Search,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { globalSearch } from "@/lib/api/search/global-search";
import type { GlobalSearchResult } from "@/lib/api/search/types";
import { cn } from "@/lib/utils";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

const CATEGORY_LINKS = {
  customers: "/customers",
  devices: "/devices",
  contracts: "/contracts",
  service_requests: "/service-requests",
} as const;

type GlobalSearchProps = {
  className?: string;
  variant?: "desktop" | "mobile";
};

function CategoryHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 py-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
      {children}
    </p>
  );
}

function ResultButton({
  href,
  onSelect,
  children,
}: {
  href: string;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted"
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => {
        onSelect();
        router.push(href);
      }}
    >
      {children}
    </button>
  );
}

function MoreLink({
  href,
  count,
  onSelect,
}: {
  href: string;
  count: number;
  onSelect: () => void;
}) {
  if (count <= 0) return null;

  return (
    <Link
      href={href}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onSelect}
      className="block px-3 py-2 text-xs font-medium text-primary hover:underline"
    >
      {count} daha →
    </Link>
  );
}

function SearchResults({
  query,
  results,
  loading,
  onSelect,
}: {
  query: string;
  results: GlobalSearchResult | null;
  loading: boolean;
  onSelect: () => void;
}) {
  const encodedQuery = encodeURIComponent(query.trim());

  if (query.trim().length < MIN_QUERY_LENGTH) {
    return (
      <p className="px-3 py-6 text-center text-sm text-muted-foreground">
        Aramak için en az {MIN_QUERY_LENGTH} karakter yazın
      </p>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 px-3 py-8 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Aranıyor…
      </div>
    );
  }

  if (!results) {
    return null;
  }

  const totalMatches =
    results.customers.total +
    results.devices.total +
    results.contracts.total +
    results.service_requests.total;

  if (totalMatches === 0) {
    return (
      <p className="px-3 py-8 text-center text-sm text-muted-foreground">
        Sonuç bulunamadı
      </p>
    );
  }

  return (
    <div className="divide-y divide-border">
      {results.customers.total > 0 ? (
        <section>
          <CategoryHeader>Müşteriler</CategoryHeader>
          {results.customers.items.map((item) => (
            <ResultButton
              key={item.id}
              href={`/customers/${item.id}`}
              onSelect={onSelect}
            >
              <Users className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0">
                <span className="block truncate font-medium text-foreground">
                  {item.name}
                </span>
                {item.city ? (
                  <span className="block truncate text-xs text-muted-foreground">
                    {item.city}
                  </span>
                ) : null}
              </span>
            </ResultButton>
          ))}
          <MoreLink
            href={`${CATEGORY_LINKS.customers}?search=${encodedQuery}`}
            count={results.customers.total - results.customers.items.length}
            onSelect={onSelect}
          />
        </section>
      ) : null}

      {results.devices.total > 0 ? (
        <section>
          <CategoryHeader>Cihazlar</CategoryHeader>
          {results.devices.items.map((item) => (
            <ResultButton
              key={item.id}
              href={`/devices/${item.id}`}
              onSelect={onSelect}
            >
              <Printer className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 truncate text-foreground">
                {item.serial_number}
                <span className="text-muted-foreground">
                  {" "}
                  • {item.brand_model} • {item.customer_name}
                </span>
              </span>
            </ResultButton>
          ))}
          <MoreLink
            href={`${CATEGORY_LINKS.devices}?search=${encodedQuery}`}
            count={results.devices.total - results.devices.items.length}
            onSelect={onSelect}
          />
        </section>
      ) : null}

      {results.contracts.total > 0 ? (
        <section>
          <CategoryHeader>Sözleşmeler</CategoryHeader>
          {results.contracts.items.map((item) => (
            <ResultButton
              key={item.id}
              href={`/contracts/${item.id}`}
              onSelect={onSelect}
            >
              <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 truncate text-foreground">
                {item.contract_number}
                <span className="text-muted-foreground">
                  {" "}
                  • {item.customer_name} • {item.status_label}
                </span>
              </span>
            </ResultButton>
          ))}
          <MoreLink
            href={`${CATEGORY_LINKS.contracts}?search=${encodedQuery}`}
            count={results.contracts.total - results.contracts.items.length}
            onSelect={onSelect}
          />
        </section>
      ) : null}

      {results.service_requests.total > 0 ? (
        <section>
          <CategoryHeader>Servis Talepleri</CategoryHeader>
          {results.service_requests.items.map((item) => (
            <ResultButton
              key={item.id}
              href={`/service-requests/${item.id}`}
              onSelect={onSelect}
            >
              <Wrench className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 truncate text-foreground">
                {item.request_number}
                <span className="text-muted-foreground">
                  {" "}
                  • {item.company_name} • {item.status_label}
                </span>
              </span>
            </ResultButton>
          ))}
          <MoreLink
            href={`${CATEGORY_LINKS.service_requests}?search=${encodedQuery}`}
            count={
              results.service_requests.total -
              results.service_requests.items.length
            }
            onSelect={onSelect}
          />
        </section>
      ) : null}
    </div>
  );
}

export function GlobalSearch({
  className,
  variant = "desktop",
}: GlobalSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GlobalSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isMobile = variant === "mobile";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    globalSearch(trimmed)
      .then((response) => {
        if (cancelled) return;
        if (!response.success) {
          setError(response.error);
          setResults(null);
          return;
        }
        setResults(response.data);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Arama sırasında bir hata oluştu");
          setResults(null);
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
  }, [debouncedQuery]);

  function handleOpenChange(
    nextOpen: boolean,
    eventDetails?: { reason?: string },
  ) {
    if (!nextOpen && eventDetails?.reason === "trigger-press") {
      return;
    }
    setOpen(nextOpen);
    if (!nextOpen && isMobile) {
      setQuery("");
      setDebouncedQuery("");
      setResults(null);
      setError(null);
    }
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    setOpen(value.trim().length >= MIN_QUERY_LENGTH);
  }

  function handleSelect() {
    setOpen(false);
    setQuery("");
    setDebouncedQuery("");
    setResults(null);
    setError(null);
  }

  function handleInputFocus() {
    if (query.trim().length >= MIN_QUERY_LENGTH) {
      setOpen(true);
    }
  }

  const showResults = open && query.trim().length >= MIN_QUERY_LENGTH;

  const resultsPanel = (
    <div className="max-h-[min(60vh,24rem)] overflow-y-auto py-1">
      {error ? (
        <p className="px-3 py-8 text-center text-sm text-destructive">{error}</p>
      ) : (
        <SearchResults
          query={query}
          results={results}
          loading={loading}
          onSelect={handleSelect}
        />
      )}
    </div>
  );

  return (
    <Popover
      open={open}
      onOpenChange={handleOpenChange}
      modal={false}
    >
      {isMobile ? (
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={className}
              aria-label="Ara"
            />
          }
          onClick={() => {
            setOpen(true);
            window.setTimeout(() => inputRef.current?.focus(), 0);
          }}
        >
          <Search className="size-5" />
        </PopoverTrigger>
      ) : (
        <PopoverTrigger
          nativeButton={false}
          render={<div className={cn("relative w-full", className)} />}
        >
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            onFocus={handleInputFocus}
            placeholder="Ara…"
            className="h-9 w-full pl-9"
            aria-label="Global arama"
            autoComplete="off"
          />
        </PopoverTrigger>
      )}

      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={6}
        initialFocus={false}
        className={cn(
          "z-50 gap-0 overflow-hidden p-0",
          isMobile
            ? "w-[min(calc(100vw-2rem),28rem)]"
            : "w-[min(500px,var(--anchor-width))]",
        )}
      >
        {isMobile ? (
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              onFocus={handleInputFocus}
              placeholder="Müşteri, cihaz, sözleşme veya servis talebi ara…"
              className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              autoComplete="off"
            />
          </div>
        ) : null}

        {showResults || isMobile ? resultsPanel : null}
      </PopoverContent>
    </Popover>
  );
}

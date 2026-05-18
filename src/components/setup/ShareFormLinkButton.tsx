"use client";

import { getApiErrorMessage } from "@/api/errors";
import { postWorkItemFormLink } from "@/api/work-item/work-item.api";
import Button from "@/components/ui/button/Button";
import { Check, Copy, Link2 } from "lucide-react";
import { useState } from "react";

export default function ShareFormLinkButton({
  companyId,
  engagementId,
  workItemId,
  label = "Share form",
  size = "sm",
}: {
  companyId: string;
  engagementId: string;
  workItemId: string;
  label?: string;
  size?: "sm" | "md";
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createAndCopy() {
    setLoading(true);
    setError(null);
    try {
      const link = await postWorkItemFormLink(
        companyId,
        engagementId,
        workItemId,
        { regenerateToken: false }
      );
      setUrl(link.url);
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not create form link."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        size={size}
        disabled={loading}
        onClick={() => void createAndCopy()}
      >
        {copied ? (
          <Check className="mr-1.5 size-3.5" aria-hidden />
        ) : (
          <Link2 className="mr-1.5 size-3.5" aria-hidden />
        )}
        {loading ? "Creating…" : copied ? "Copied link" : label}
        {!loading && !copied ? (
          <Copy className="ml-1 size-3 opacity-60" aria-hidden />
        ) : null}
      </Button>
      {url ? (
        <code className="max-w-[14rem] truncate text-[10px] text-gray-400">
          {url}
        </code>
      ) : null}
      {error ? (
        <p className="max-w-xs text-right text-[10px] text-error-600">{error}</p>
      ) : null}
    </div>
  );
}

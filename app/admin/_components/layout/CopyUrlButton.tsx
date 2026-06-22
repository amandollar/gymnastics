"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CopyUrlButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 ml-1.5 transition-colors cursor-pointer flex items-center justify-center"
      title={copied ? "Copied!" : "Copy URL"}
      type="button"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-500 animate-bounce" strokeWidth={3} />
      ) : (
        <Copy className="w-3.5 h-3.5" strokeWidth={2.5} />
      )}
    </button>
  );
}

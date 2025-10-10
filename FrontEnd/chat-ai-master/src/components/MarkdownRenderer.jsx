import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import "katex/dist/katex.min.css";
import { Copy } from "lucide-react";

export default function MarkdownRenderer({ content }) {
  const [isDark, setIsDark] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  // ✅ Theo dõi dark mode (Tailwind)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (document?.documentElement) {
        setIsDark(document.documentElement.classList.contains("dark"));
      }
    });

    if (document?.documentElement) {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });

      setIsDark(document.documentElement.classList.contains("dark"));
    }

    return () => observer.disconnect();
  }, []);

  const cleanedContent =
    typeof content === "string"
      ? content
          .replaceAll("\\\\(", "(")
          .replaceAll("\\\\)", ")")
          .replaceAll("\\n", "\n")
      : "";

  const handleCopy = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1500);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  return (
    <div
      className="
        markdown-body text-[15px] leading-relaxed 
        text-gray-900 dark:text-gray-100
        prose prose-sm max-w-none 
        prose-pre:bg-transparent prose-code:font-mono 
        [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
      "
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const codeString = String(children).replace(/\n$/, "");

            // ✅ Code block (giống ChatGPT dark)
            if (!inline && match) {
              return (
                <div
                  className={`relative group my-4 rounded-xl overflow-hidden border shadow-sm ${
                    isDark
                      ? "border-[#565869] bg-[#1E1E1E]"
                      : "border-gray-300 bg-gray-50"
                  }`}
                >
                  <button
                    onClick={() => handleCopy(codeString)}
                    className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs px-2 py-1 rounded-md flex items-center gap-1 ${
                      isDark
                        ? "bg-[#2A2B32] hover:bg-[#3A3B42] text-[#ECECF1]"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                    }`}
                  >
                    <Copy className="w-3 h-3" />
                    {copiedCode === codeString ? "Copied" : "Copy"}
                  </button>

                  <SyntaxHighlighter
                    language={match[1]}
                    style={isDark ? oneDark : oneLight}
                    PreTag="div"
                    className="!m-0 !p-4 !text-sm !leading-relaxed !bg-transparent font-mono"
                    {...props}
                  >
                    {codeString}
                  </SyntaxHighlighter>
                </div>
              );
            }

            // ✅ Inline code (giống ChatGPT)
            return (
              <code
                className={`px-1.5 py-0.5 rounded-md text-[14px] font-mono ${
                  isDark
                    ? "bg-[#2F2F2F] text-[#ECECF1]"
                    : "bg-gray-100 text-gray-800"
                }`}
                {...props}
              >
                {children}
              </code>
            );
          },

          // ✅ Link
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#19C37D] hover:underline"
              >
                {children}
              </a>
            );
          },

          // ✅ List
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1">{children}</ol>
          ),
          p: ({ children }) => <p className="my-2">{children}</p>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[#19C37D] pl-3 text-gray-300 italic my-2">
              {children}
            </blockquote>
          ),
        }}
      >
        {cleanedContent}
      </ReactMarkdown>
    </div>
  );
}

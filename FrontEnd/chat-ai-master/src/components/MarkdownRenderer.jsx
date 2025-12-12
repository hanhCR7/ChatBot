import React, { useEffect, useState, useMemo, useCallback, memo } from "react";
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
import { Copy, Check } from "lucide-react";

function MarkdownRenderer({ content }) {
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

  const cleanedContent = useMemo(() => {
    if (typeof content !== "string") return "";
    return content
      .replaceAll("\\\\(", "(")
      .replaceAll("\\\\)", ")")
      .replaceAll("\\n", "\n");
  }, [content]);

  const handleCopy = useCallback(async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1500);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  }, []);

  return (
    <div
      className="
        markdown-body text-[15px] leading-relaxed 
        text-gray-900 dark:text-gray-100
        prose prose-sm max-w-none 
        prose-pre:bg-transparent prose-code:font-mono 
        [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
        [&_pre]:overflow-x-auto [&_pre]:scrollbar-thin
        [&_pre]:scrollbar-thumb-gray-400 [&_pre]:scrollbar-track-transparent
        [&_p]:whitespace-pre-wrap [&_p]:break-words
      "
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const codeString = String(children).replace(/\n$/, "");

            // ✅ Code block với format tốt hơn
            if (!inline && match) {
              const language = match[1];
              const lines = codeString.split('\n');
              
              return (
                <div
                  className={`relative group my-6 rounded-xl overflow-hidden border shadow-lg ${
                    isDark
                      ? "border-gray-700 bg-[#1E1E1E]"
                      : "border-gray-300 bg-gray-50"
                  }`}
                >
                  {/* Header với language và copy button */}
                  <div className={`flex items-center justify-between px-4 py-2.5 border-b ${
                    isDark
                      ? "bg-[#2A2B32] border-gray-700"
                      : "bg-gray-100 border-gray-200"
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        isDark
                          ? "bg-[#3A3B42] text-gray-300"
                          : "bg-gray-200 text-gray-700"
                      }`}>
                        {language}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {lines.length} dòng
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(codeString)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isDark
                          ? copiedCode === codeString
                            ? "bg-green-600/20 text-green-400"
                            : "bg-[#3A3B42] hover:bg-[#4A4B52] text-gray-300"
                          : copiedCode === codeString
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                      }`}
                    >
                      {copiedCode === codeString ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Đã sao chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Code content với scroll */}
                  <div className="overflow-x-auto">
                    <SyntaxHighlighter
                      language={language}
                      style={isDark ? oneDark : oneLight}
                      PreTag="div"
                      className="!m-0 !p-4 !text-sm !leading-[1.6] !bg-transparent font-mono !overflow-visible"
                      customStyle={{
                        margin: 0,
                        padding: '1rem',
                        background: 'transparent',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                      }}
                      codeTagProps={{
                        style: {
                          fontFamily: 'inherit',
                          whiteSpace: 'pre',
                          wordBreak: 'normal',
                          overflowWrap: 'normal',
                        }
                      }}
                      {...props}
                    >
                      {codeString}
                    </SyntaxHighlighter>
                  </div>
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
            <ul className="list-disc list-inside space-y-2 my-3 ml-4">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-2 my-3 ml-4">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="my-1">{children}</li>
          ),
          p: ({ children }) => (
            <p className="my-3 leading-relaxed whitespace-pre-wrap break-words">{children}</p>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 py-2 my-3 italic bg-blue-50/50 dark:bg-blue-950/20 rounded-r-lg">
              {children}
            </blockquote>
          ),
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold my-4 text-gray-900 dark:text-white">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold my-3 text-gray-900 dark:text-white">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold my-2 text-gray-900 dark:text-white">{children}</h3>
          ),
          hr: () => (
            <hr className="my-4 border-gray-300 dark:border-gray-700" />
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-700">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 bg-gray-100 dark:bg-gray-800 font-semibold text-left">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">
              {children}
            </td>
          ),
        }}
      >
        {cleanedContent}
      </ReactMarkdown>
    </div>
  );
}

export default memo(MarkdownRenderer);

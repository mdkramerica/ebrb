"use client";

import ReactMarkdown, { type Components } from "react-markdown";

const components: Components = {
  p: ({ children }) => (
    <p className="text-[#E5E7EB] text-sm leading-relaxed mb-3 last:mb-0">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="text-[#F9F7F3] font-semibold">{children}</strong>
  ),
  em: ({ children }) => <em className="text-[#E5E7EB] italic">{children}</em>,
  h1: ({ children }) => (
    <h1 className="font-display text-2xl font-light text-[#F9F7F3] mt-5 mb-3 leading-tight first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-display text-xl font-light text-[#F9F7F3] mt-5 mb-3 leading-tight first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-medium text-[#F9F7F3] mt-4 mb-2 leading-snug first:mt-0">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-sm font-semibold text-[#F9F7F3] mt-3 mb-1.5 uppercase tracking-wider first:mt-0">
      {children}
    </h4>
  ),
  ul: ({ children }) => (
    <ul className="list-none space-y-1.5 mb-3 last:mb-0 pl-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal marker:text-[#C5933A] space-y-1.5 mb-3 last:mb-0 pl-5">
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => {
    // Distinguish ordered vs unordered list items via parent type isn't directly
    // exposed by react-markdown 10, so we render a leading gold dash for the
    // unordered case via a CSS pseudo-element class. For OL items the marker
    // attribute on the parent handles numbering.
    const isOrdered = (props as { ordered?: boolean }).ordered;
    if (isOrdered) {
      return (
        <li className="text-[#E5E7EB] text-sm leading-relaxed pl-1">{children}</li>
      );
    }
    return (
      <li className="text-[#E5E7EB] text-sm leading-relaxed pl-5 relative before:content-['—'] before:absolute before:left-0 before:text-[#C5933A]">
        {children}
      </li>
    );
  },
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#C5933A] underline underline-offset-2 hover:text-[#E8D5A3] transition-colors"
    >
      {children}
    </a>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code className="font-mono text-xs text-[#E8D5A3]">{children}</code>
      );
    }
    return (
      <code className="font-mono text-xs text-[#C5933A] bg-[#0A1421] border border-[#2A3F5F] px-1.5 py-0.5 rounded-sm">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="bg-[#0A1421] border border-[#2A3F5F] p-3 my-3 overflow-x-auto text-xs leading-relaxed">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-[#C5933A] pl-4 my-3 italic text-[#9CA3AF]">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4 border-0 border-t border-[#2A3F5F]" />,
  table: ({ children }) => (
    <div className="overflow-x-auto my-3">
      <table className="w-full text-sm border border-[#2A3F5F]">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="text-left px-3 py-2 bg-[#152338] text-[#F9F7F3] font-medium border-b border-[#2A3F5F]">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-[#E5E7EB] border-b border-[#2A3F5F]/60">{children}</td>
  ),
};

export function AssistantMarkdown({ content }: { content: string }) {
  return <ReactMarkdown components={components}>{content}</ReactMarkdown>;
}

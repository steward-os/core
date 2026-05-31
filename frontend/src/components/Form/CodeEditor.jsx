import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { json } from "@codemirror/lang-json";

const langExtensions = {
  html: [html()],
  json: [json()],
};

function serializeNode(node, depth) {
  const indent = "  ".repeat(depth);

  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent.trim();
    return text ? `${indent}${text}` : null;
  }
  if (node.nodeType === Node.COMMENT_NODE) {
    return `${indent}<!--${node.nodeValue}-->`;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const tag = node.tagName;
  const attrs = Array.from(node.attributes)
    .map((a) => `${a.name}="${a.value}"`)
    .join(" ");
  const open = attrs ? `<${tag} ${attrs}>` : `<${tag}>`;

  const children = Array.from(node.childNodes)
    .map((child) => serializeNode(child, depth + 1))
    .filter(Boolean);

  if (children.length === 0) {
    return attrs ? `${indent}<${tag} ${attrs} />` : `${indent}<${tag} />`;
  }

  // Inline if single text child
  if (children.length === 1 && node.childNodes[0].nodeType === Node.TEXT_NODE) {
    const text = node.childNodes[0].textContent.trim();
    if (text) return `${indent}${open}${text}</${tag}>`;
  }

  return `${indent}${open}\n${children.join("\n")}\n${indent}</${tag}>`;
}

function formatXml(xml) {
  // Temporarily replace {{...}} mustache placeholders — they're not valid XML
  const placeholders = [];
  const sanitized = xml.replace(/\{\{[^}]+\}\}/g, (match) => {
    placeholders.push(match);
    return `__PH${placeholders.length - 1}__`;
  });

  try {
    const doc = new DOMParser().parseFromString(sanitized, "application/xml");
    if (doc.querySelector("parsererror")) return null;
    const formatted = serializeNode(doc.documentElement, 0);
    return formatted.replace(/__PH(\d+)__/g, (_, i) => placeholders[Number(i)]);
  } catch {
    return null;
  }
}

function formatJson(value) {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return null;
  }
}

const CodeEditor = ({ value, onChange, lang = "html", minHeight = "160px", className = "" }) => {
  const extensions = langExtensions[lang] ?? langExtensions.html;

  const handleFormat = () => {
    const formatted = lang === "json" ? formatJson(value) : formatXml(value);
    if (formatted !== null) onChange(formatted);
  };

  return (
    <div className={`rounded-lg overflow-hidden border border-black/20 dark:border-white/20 ${className}`}>
      <div className="flex justify-end bg-gray-50 dark:bg-gray-800 border-b border-black/10 dark:border-white/10 px-2 py-1">
        <button
          type="button"
          onClick={handleFormat}
          className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors px-2 py-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          Formatteren
        </button>
      </div>
      <CodeMirror
        value={value}
        extensions={extensions}
        onChange={onChange}
        minHeight={minHeight}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: true,
          indentOnInput: true,
        }}
      />
    </div>
  );
};

export default CodeEditor;

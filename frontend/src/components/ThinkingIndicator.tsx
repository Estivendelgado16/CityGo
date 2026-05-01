export function ThinkingIndicator({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 my-2">
      <div className="flex gap-1">
        <div className="w-2 h-2 rounded-full bg-primary-400 thinking-dot" />
        <div className="w-2 h-2 rounded-full bg-primary-400 thinking-dot" />
        <div className="w-2 h-2 rounded-full bg-primary-400 thinking-dot" />
      </div>
      <span className="text-sm text-gray-400 italic">{text}</span>
    </div>
  );
}

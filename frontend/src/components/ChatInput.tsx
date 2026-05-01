import { useState } from "react";
import { SendHorizontal } from "lucide-react";

interface Props {
  onSend: (message: string) => void;
  disabled: boolean;
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <div className="flex items-end gap-2 p-3 bg-white border-t border-gray-100">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        placeholder="¿Qué quieres hacer en Medellín?"
        rows={1}
        className="flex-1 resize-none rounded-2xl bg-gray-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 placeholder:text-gray-400 max-h-24"
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !text.trim()}
        className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-primary-500 text-white disabled:opacity-40 transition-all active:scale-95 hover:bg-primary-600"
      >
        <SendHorizontal size={18} />
      </button>
    </div>
  );
}

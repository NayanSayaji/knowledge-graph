import { useState } from "react";
import { X } from "./icons";

interface ChipInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  ariaLabel: string;
}

export function ChipInput({
  values,
  onChange,
  placeholder,
  ariaLabel,
}: ChipInputProps) {
  const [input, setInput] = useState("");

  function commit(raw: string) {
    const additions = raw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    if (!additions.length) return;

    const merged = new Map(
      [...values, ...additions].map((value) => [
        value.toLocaleLowerCase(),
        value,
      ]),
    );
    onChange([...merged.values()]);
    setInput("");
  }

  function remove(value: string) {
    onChange(values.filter((item) => item !== value));
  }

  return (
    <div className="chip-input" onClick={(event) => {
      event.currentTarget.querySelector("input")?.focus();
    }}>
      {values.map((value) => (
        <span className="chip" key={value}>
          {value}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              remove(value);
            }}
            aria-label={`Remove ${value}`}
          >
            <X />
          </button>
        </span>
      ))}
      <input
        aria-label={ariaLabel}
        value={input}
        onChange={(event) => {
          const next = event.target.value;
          if (next.includes(",")) commit(next);
          else setInput(next);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit(input);
          } else if (event.key === "Backspace" && !input && values.length) {
            remove(values.at(-1)!);
          }
        }}
        onBlur={() => commit(input)}
        placeholder={values.length ? "" : placeholder}
      />
    </div>
  );
}

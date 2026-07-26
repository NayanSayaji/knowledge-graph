import { useState } from "react";
import { X } from "./icons";

interface ChipInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  ariaLabel: string;
  maxValueLength?: number;
  visibleLimit?: number;
}

export function mergeChipValues(
  values: string[],
  raw: string,
  maxValueLength = 25,
) {
  const additions = raw
    .split(",")
    .map((value) => value.trim().slice(0, maxValueLength))
    .filter(Boolean);

  return [
    ...new Map(
      [...values, ...additions].map((value) => [
        value.toLocaleLowerCase(),
        value,
      ]),
    ).values(),
  ];
}

export function ChipInput({
  values,
  onChange,
  placeholder,
  ariaLabel,
  maxValueLength = 25,
  visibleLimit = 2,
}: ChipInputProps) {
  const [input, setInput] = useState("");
  const visibleValues = values.slice(0, visibleLimit);
  const hiddenValues = values.slice(visibleLimit);

  function commit(raw: string) {
    const nextValues = mergeChipValues(values, raw, maxValueLength);
    if (nextValues.length === values.length && !raw.trim()) return;

    onChange(nextValues);
    setInput("");
  }

  function remove(value: string) {
    onChange(values.filter((item) => item !== value));
  }

  return (
    <div
      className="chip-input"
      onClick={(event) => {
        event.currentTarget.querySelector("input")?.focus();
      }}
    >
      {visibleValues.map((value) => (
        <span className="chip" key={value}>
          <span className="chip-label">{value}</span>
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
      {hiddenValues.length > 0 && (
        <span
          className="chip-overflow"
          title={hiddenValues.join(", ")}
          aria-label={`${hiddenValues.length} more: ${hiddenValues.join(", ")}`}
        >
          +{hiddenValues.length} more
        </span>
      )}
      <input
        aria-label={ariaLabel}
        value={input}
        onChange={(event) => {
          const next = event.target.value;
          if (next.includes(",")) commit(next);
          else setInput(next.slice(0, maxValueLength));
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

"use client";

import { useMemo } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

export type SearchableOption = {
  value: string;
  label: string;
  keywords?: string;
};

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  allowCustom = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SearchableOption[];
  placeholder: string;
  emptyText?: string;
  allowCustom?: boolean;
}) {
  const selected = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );

  return (
    <Autocomplete
      freeSolo={allowCustom}
      options={options}
      value={selected ?? (allowCustom ? value : null)}
      onChange={(_, next) => {
        if (typeof next === "string") {
          onChange(next);
          return;
        }
        onChange(next?.value ?? "");
      }}
      onInputChange={(_, inputValue, reason) => {
        if (allowCustom && reason === "input") {
          onChange(inputValue);
        }
      }}
      getOptionLabel={(option) => (typeof option === "string" ? option : option.label)}
      isOptionEqualToValue={(option, current) =>
        typeof current === "string" ? option.value === current : option.value === current.value
      }
      renderInput={(params) => <TextField {...params} label={placeholder} />}
      slotProps={{
        popper: {
          sx: { zIndex: 9999 },
        },
      }}
    />
  );
}

"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store/useAppStore";
import { listPersonas, tabsForPersona, getPersona } from "@/lib/access/personas";
import type { PersonaId } from "@/lib/data/types";

/** Header "View as" switcher — Section 5's six personas, in spec order. */
export function PersonaSwitcher() {
  const router = useRouter();
  const personaId = useAppStore((s) => s.personaId);
  const setPersona = useAppStore((s) => s.setPersona);

  function handleChange(id: string) {
    const next = id as PersonaId;
    setPersona(next);
    const firstTab = tabsForPersona(getPersona(next))[0];
    router.push(`/${firstTab}`);
  }

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor="persona-switcher"
        className="text-[10px] font-bold uppercase tracking-widest text-hiyya-muted"
      >
        View as
      </label>
      <Select value={personaId} onValueChange={handleChange}>
        <SelectTrigger
          id="persona-switcher"
          className="min-w-[220px] border-hiyya-panel-2 bg-hiyya-panel-2"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {listPersonas().map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

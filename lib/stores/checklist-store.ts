import { create } from "zustand"
import type { ChecklistItem, ChecklistTemplateItem } from "@/lib/crm-types"

interface ChecklistState {
  // Active checklist being filled
  items: Map<string, ChecklistItem> // keyed by template_item_id
  templateItems: ChecklistTemplateItem[]
  currentSection: string | null

  // Actions
  setTemplateItems: (items: ChecklistTemplateItem[]) => void
  setResponse: (templateItemId: string, item: Partial<ChecklistItem>) => void
  setCurrentSection: (section: string | null) => void
  getProgress: () => { total: number; answered: number; percentage: number }
  getScore: () => { cumple: number; noCumple: number; na: number; total: number; percentage: number }
  reset: () => void
}

export const useChecklistStore = create<ChecklistState>((set, get) => ({
  items: new Map(),
  templateItems: [],
  currentSection: null,

  setTemplateItems: (templateItems) => set({ templateItems }),

  setResponse: (templateItemId, item) =>
    set((state) => {
      const newItems = new Map(state.items)
      const existing = newItems.get(templateItemId) || ({} as ChecklistItem)
      newItems.set(templateItemId, { ...existing, ...item, template_item_id: templateItemId } as ChecklistItem)
      return { items: newItems }
    }),

  setCurrentSection: (section) => set({ currentSection: section }),

  getProgress: () => {
    const { items, templateItems } = get()
    const answerable = templateItems.filter((ti) => ti.tipo_respuesta !== "foto")
    const answered = answerable.filter((ti) => {
      const item = items.get(ti.id)
      return item?.respuesta != null && item.respuesta !== ""
    })
    const total = answerable.length
    return {
      total,
      answered: answered.length,
      percentage: total > 0 ? Math.round((answered.length / total) * 100) : 0,
    }
  },

  getScore: () => {
    const { items, templateItems } = get()
    const scorable = templateItems.filter(
      (ti) => ti.tipo_respuesta === "si_no_na" || ti.tipo_respuesta === "si_no"
    )
    let cumple = 0
    let noCumple = 0
    let na = 0
    for (const ti of scorable) {
      const item = items.get(ti.id)
      if (!item?.respuesta) continue
      if (item.respuesta === "si") cumple++
      else if (item.respuesta === "no") noCumple++
      else if (item.respuesta === "na") na++
    }
    const evaluated = cumple + noCumple
    return {
      cumple,
      noCumple,
      na,
      total: scorable.length,
      percentage: evaluated > 0 ? Math.round((cumple / evaluated) * 100) : 0,
    }
  },

  reset: () =>
    set({
      items: new Map(),
      templateItems: [],
      currentSection: null,
    }),
}))

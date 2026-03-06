import { create } from "zustand"
import type { MeasurementPoint, ProtocolType } from "@/lib/crm-types"

interface ProtocolState {
  // Active protocol state
  protocolType: ProtocolType | null
  points: MeasurementPoint[]
  editingPointIndex: number | null

  // Actions
  setProtocolType: (type: ProtocolType | null) => void
  setPoints: (points: MeasurementPoint[]) => void
  addPoint: (point: MeasurementPoint) => void
  updatePoint: (index: number, point: Partial<MeasurementPoint>) => void
  removePoint: (index: number) => void
  setEditingPointIndex: (index: number | null) => void
  getComplianceSummary: () => { total: number; cumple: number; noCumple: number; percentage: number }
  reset: () => void
}

export const useProtocolStore = create<ProtocolState>((set, get) => ({
  protocolType: null,
  points: [],
  editingPointIndex: null,

  setProtocolType: (type) => set({ protocolType: type }),

  setPoints: (points) => set({ points }),

  addPoint: (point) =>
    set((state) => ({ points: [...state.points, point] })),

  updatePoint: (index, updates) =>
    set((state) => {
      const newPoints = [...state.points]
      newPoints[index] = { ...newPoints[index], ...updates } as MeasurementPoint
      return { points: newPoints }
    }),

  removePoint: (index) =>
    set((state) => ({
      points: state.points.filter((_, i) => i !== index),
    })),

  setEditingPointIndex: (index) => set({ editingPointIndex: index }),

  getComplianceSummary: () => {
    const { points } = get()
    const evaluated = points.filter((p) => p.cumple !== null)
    const cumple = evaluated.filter((p) => p.cumple === true).length
    const noCumple = evaluated.filter((p) => p.cumple === false).length
    return {
      total: evaluated.length,
      cumple,
      noCumple,
      percentage: evaluated.length > 0 ? Math.round((cumple / evaluated.length) * 100) : 0,
    }
  },

  reset: () =>
    set({
      protocolType: null,
      points: [],
      editingPointIndex: null,
    }),
}))

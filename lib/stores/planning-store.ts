import { create } from "zustand"
import type { PlanTask, PlanTaskType, PlanTaskStatus } from "@/lib/crm-types"

interface PlanningState {
  // Current view state
  selectedYear: number
  selectedMonth: number | null

  // Task being edited
  editingTask: PlanTask | null

  // Filters
  filterType: PlanTaskType | "all"
  filterStatus: PlanTaskStatus | "all"

  // Actions
  setSelectedYear: (year: number) => void
  setSelectedMonth: (month: number | null) => void
  setEditingTask: (task: PlanTask | null) => void
  setFilterType: (type: PlanTaskType | "all") => void
  setFilterStatus: (status: PlanTaskStatus | "all") => void
  reset: () => void
}

export const usePlanningStore = create<PlanningState>((set) => ({
  selectedYear: new Date().getFullYear(),
  selectedMonth: null,
  editingTask: null,
  filterType: "all",
  filterStatus: "all",

  setSelectedYear: (year) => set({ selectedYear: year }),
  setSelectedMonth: (month) => set({ selectedMonth: month }),
  setEditingTask: (task) => set({ editingTask: task }),
  setFilterType: (type) => set({ filterType: type }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  reset: () =>
    set({
      selectedMonth: null,
      editingTask: null,
      filterType: "all",
      filterStatus: "all",
    }),
}))

"use client"

import { differenceInDays } from "date-fns"
import { Badge } from "@/components/ui/badge"
import type { InstrumentCalibration } from "@/lib/crm-types"

interface CalibrationStatus {
  label: string
  variant: "default" | "secondary" | "destructive" | "outline"
  className: string
  blocked: boolean
}

export function getCalibrationStatus(
  calibration: InstrumentCalibration | undefined | null
): CalibrationStatus {
  if (!calibration) {
    return {
      label: "Sin calibrar",
      variant: "destructive",
      className: "",
      blocked: true,
    }
  }
  const daysUntilExpiry = differenceInDays(
    new Date(calibration.fecha_vencimiento),
    new Date()
  )
  if (daysUntilExpiry < 0) {
    return {
      label: "Vencido",
      variant: "destructive",
      className: "",
      blocked: true,
    }
  }
  if (daysUntilExpiry < 30) {
    return {
      label: `Vence en ${daysUntilExpiry}d`,
      variant: "outline",
      className:
        "border-yellow-500 text-yellow-700 dark:text-yellow-400",
      blocked: false,
    }
  }
  return {
    label: "Vigente",
    variant: "outline",
    className:
      "border-green-500 text-green-700 dark:text-green-400",
    blocked: false,
  }
}

export function CalibrationBadge({
  calibration,
}: {
  calibration: InstrumentCalibration | undefined | null
}) {
  const status = getCalibrationStatus(calibration)
  return (
    <Badge variant={status.variant} className={status.className}>
      {status.label}
    </Badge>
  )
}

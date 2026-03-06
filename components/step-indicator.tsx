"use client"

import { cn } from "@/lib/utils"
import { STEPS } from "@/lib/store"
import { Check } from "lucide-react"

interface StepIndicatorProps {
  currentStep: number
  onStepClick: (step: number) => void
}

export function StepIndicator({ currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <nav aria-label="Progreso del formulario" className="w-full">
      <ol className="flex items-center gap-1">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep
          return (
            <li key={step.id} className="flex items-center flex-1">
              <button
                type="button"
                onClick={() => onStepClick(index)}
                className={cn(
                  "flex flex-col items-center gap-1.5 w-full group transition-colors",
                  isCompleted && "cursor-pointer",
                  isCurrent && "cursor-default",
                  !isCompleted && !isCurrent && "cursor-pointer"
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-all border-2",
                    isCompleted &&
                      "bg-primary border-primary text-primary-foreground",
                    isCurrent &&
                      "bg-card border-primary text-primary shadow-md",
                    !isCompleted &&
                      !isCurrent &&
                      "bg-card border-border text-muted-foreground group-hover:border-primary/40"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium text-center leading-tight hidden lg:block",
                    isCurrent && "text-primary",
                    isCompleted && "text-primary",
                    !isCompleted && !isCurrent && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </button>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-px flex-1 mx-1",
                    isCompleted ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

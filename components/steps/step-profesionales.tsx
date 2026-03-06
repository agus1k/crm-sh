"use client"

import type { Profesional } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserCheck, Plus, Trash2 } from "lucide-react"

interface Props {
  data: Profesional[]
  onChange: (data: Profesional[]) => void
}

const ROLES: { value: Profesional["rol"]; label: string }[] = [
  { value: "elaboro", label: "Elaboro" },
  { value: "colaboro", label: "Colaboro" },
  { value: "aprobo", label: "Aprobo" },
]

export function StepProfesionales({ data, onChange }: Props) {
  const addProfesional = () => {
    onChange([...data, { nombre: "", matricula: "", rol: "colaboro" }])
  }

  const removeProfesional = (index: number) => {
    onChange(data.filter((_, i) => i !== index))
  }

  const updateProfesional = (
    index: number,
    field: keyof Profesional,
    value: string
  ) => {
    const updated = [...data]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <UserCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Profesionales Actuantes</CardTitle>
                <CardDescription>
                  Equipo tecnico responsable del estudio
                </CardDescription>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addProfesional}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Agregar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {data.map((prof, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 p-4 bg-muted/50 rounded-lg border border-border"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">
                  Profesional {index + 1}
                </span>
                {data.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeProfesional(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`prof-nombre-${index}`}>
                    Nombre Completo
                  </Label>
                  <Input
                    id={`prof-nombre-${index}`}
                    placeholder="Ej: Lic. Marcelo Cabali"
                    value={prof.nombre}
                    onChange={(e) =>
                      updateProfesional(index, "nombre", e.target.value)
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`prof-matricula-${index}`}>Matricula</Label>
                  <Input
                    id={`prof-matricula-${index}`}
                    placeholder="Ej: CPSH LHS-007912"
                    value={prof.matricula}
                    onChange={(e) =>
                      updateProfesional(index, "matricula", e.target.value)
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Rol</Label>
                  <Select
                    value={prof.rol}
                    onValueChange={(value) =>
                      updateProfesional(index, "rol", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Topbar } from "@/components/layout/topbar"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Loader2, ArrowLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

import { StepIndicator } from "@/components/step-indicator"
import { StepEmpresa } from "@/components/steps/step-empresa"
import { StepProfesionales } from "@/components/steps/step-profesionales"
import { StepSectores } from "@/components/steps/step-sectores"
import { StepMateriales } from "@/components/steps/step-materiales"
import { StepExtintores } from "@/components/steps/step-extintores"
import { StepEvacuacion } from "@/components/steps/step-evacuacion"
import { StepResultados } from "@/components/steps/step-resultados"
import { StepInforme } from "@/components/steps/step-informe"

import { DEFAULT_FORM_STATE, STEPS } from "@/lib/store"
import type { FormState, ExtintorExistente, InstalacionContraIncendio } from "@/lib/types"
import { calcularTodo } from "@/lib/calculos"

function WizardContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const projectId = searchParams.get("proyecto")
  const title = searchParams.get("titulo")
  const existingReportId = searchParams.get("id")

  const { profile } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [reportId, setReportId] = useState<string | null>(existingReportId)
  
  const [formData, setFormData] = useState<FormState>(DEFAULT_FORM_STATE)

  useEffect(() => {
    const initReport = async () => {
      if (!profile?.organization_id) return
      const supabase = createClient()
      
      if (existingReportId) {
        const { data, error } = await supabase.from("reports").select("*").eq("id", existingReportId).single()
        if (data && data.form_data && Object.keys(data.form_data).length > 0) {
          setFormData((prev) => ({ ...prev, ...data.form_data }))
        } else if (error) {
          toast.error("No se pudo cargar el informe")
        }
        setLoading(false)
        return
      }

      if (projectId && title) {
        const { data, error } = await supabase.from("reports").insert({
          organization_id: profile.organization_id,
          project_id: projectId,
          report_type: "carga_de_fuego",
          title: title,
          status: "borrador",
          form_data: DEFAULT_FORM_STATE,
          result_data: {},
          version: 1,
          created_by: profile.id
        }).select("id").single()
        
        if (error) { toast.error("Error inicializando el informe"); router.push("/informes") }
        else { setReportId(data.id); setLoading(false) }
      } else {
        setLoading(false)
      }
    }
    initReport()
  }, [profile, projectId, title, existingReportId, router])

  const saveToCRM = async (currentData: FormState) => {
    if (!reportId) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from("reports").update({ 
      form_data: currentData,
      updated_at: new Date().toISOString() 
    }).eq("id", reportId)
    setSaving(false)
    if (error) toast.error("Error al guardar progreso")
  }

  const handleNext = () => {
    const nextStep = Math.min(formData.currentStep + 1, STEPS.length - 1)
    
    let newData = { ...formData, currentStep: nextStep }
    if (formData.currentStep === 5) {
      newData.resultados = calcularTodo(formData.sectores, formData.extintoresExistentes, formData.datosEvacuacion)
    }
    
    setFormData(newData)
    saveToCRM(newData)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleBack = () => {
    const prevStep = Math.max(formData.currentStep - 1, 0)
    const newData = { ...formData, currentStep: prevStep }
    setFormData(newData)
    saveToCRM(newData)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleStepClick = (stepIndex: number) => {
    const newData = { ...formData, currentStep: stepIndex }
    setFormData(newData)
    saveToCRM(newData)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleComplete = async () => {
    if (reportId) {
      setSaving(true)
      const supabase = createClient()
      const { error } = await supabase.from("reports").update({ 
        form_data: formData,
        status: "completado", 
        updated_at: new Date().toISOString() 
      }).eq("id", reportId)
      setSaving(false)
      if (error) { toast.error("Error al completar el informe"); return }
      toast.success("Informe de Carga de Fuego completado y guardado")
      router.push("/informes")
    }
  }

  if (loading) {
    return <div className="h-[60vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/informes")} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Estudio de Carga de Fuego</h1>
            <p className="text-muted-foreground text-sm flex items-center gap-2">
              {title ? `Proyecto: ${title}` : "Borrador de estudio"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {saving && <span className="flex items-center gap-1.5 text-xs text-primary bg-primary/10 px-2 py-1 rounded-full"><Loader2 className="h-3 w-3 animate-spin"/> Guardando...</span>}
          <Button variant="outline" size="sm" onClick={() => saveToCRM(formData)} disabled={saving} className="gap-2 hidden sm:flex">
            <Save className="h-4 w-4" /> Guardar progreso
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border shadow-sm rounded-xl p-4 sm:p-6 mb-8 overflow-x-auto">
        <div className="min-w-[600px]">
          <StepIndicator currentStep={formData.currentStep} onStepClick={handleStepClick} />
        </div>
      </div>

      <div className="mt-8">
        {formData.currentStep === 0 && <StepEmpresa data={formData.empresa} onChange={(d) => setFormData({ ...formData, empresa: d })} />}
        {formData.currentStep === 1 && <StepProfesionales data={formData.profesionales} onChange={(d) => setFormData({ ...formData, profesionales: d })} />}
        {formData.currentStep === 2 && <StepSectores data={formData.sectores} onChange={(d) => setFormData({ ...formData, sectores: d })} />}
        {formData.currentStep === 3 && <StepMateriales sectores={formData.sectores} onChange={(d) => setFormData({ ...formData, sectores: d })} />}
        {formData.currentStep === 4 && <StepExtintores sectores={formData.sectores} extintores={formData.extintoresExistentes} instalaciones={formData.instalacionesContraIncendio} onChangeExtintores={(ext: ExtintorExistente[]) => setFormData({ ...formData, extintoresExistentes: ext })} onChangeInstalaciones={(inst: InstalacionContraIncendio[]) => setFormData({ ...formData, instalacionesContraIncendio: inst })} />}
        {formData.currentStep === 5 && <StepEvacuacion sectores={formData.sectores} data={formData.datosEvacuacion} onChange={(d) => setFormData({ ...formData, datosEvacuacion: d })} />}
        {formData.currentStep === 6 && <StepResultados resultados={formData.resultados} sectores={formData.sectores} />}
        {formData.currentStep === 7 && <StepInforme formState={formData} />}
      </div>

      <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
        <Button variant="outline" onClick={handleBack} disabled={formData.currentStep === 0}>
          Anterior
        </Button>
        {formData.currentStep === STEPS.length - 1 ? (
          <Button onClick={handleComplete} disabled={saving} className="gap-2">
            Finalizar y Generar PDF
          </Button>
        ) : (
          <Button onClick={handleNext}>
            Siguiente
          </Button>
        )}
      </div>
    </div>
  )
}

export default function CargaDeFuegoPage() {
  return (
    <>
      <Topbar title="Asistente: Carga de Fuego" />
      <div className="p-4 lg:p-6 bg-muted/10 min-h-screen">
        <Suspense fallback={<div className="h-[60vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
          <WizardContent />
        </Suspense>
      </div>
    </>
  )
}

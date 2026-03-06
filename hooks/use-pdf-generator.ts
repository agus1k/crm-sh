"use client"

import { useState, useCallback } from "react"
import { pdf, DocumentProps } from "@react-pdf/renderer"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface UsePDFGeneratorOptions {
  organizationId: string
  recordType: string
  recordId: string
  fileName?: string
}

interface PDFGeneratorResult {
  generating: boolean
  pdfUrl: string | null
  generatePDF: (document: React.ReactElement<DocumentProps>) => Promise<string | null>
  downloadPDF: () => void
}

export function usePDFGenerator({
  organizationId,
  recordType,
  recordId,
  fileName,
}: UsePDFGeneratorOptions): PDFGeneratorResult {
  const [generating, setGenerating] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  const generatePDF = useCallback(
    async (document: React.ReactElement<DocumentProps>): Promise<string | null> => {
      setGenerating(true)
      try {
        // Generate PDF blob
        const blob = await pdf(document).toBlob()

        const supabase = createClient()
        const path = `${organizationId}/${recordType}/${recordId}.pdf`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("reports")
          .upload(path, blob, {
            contentType: "application/pdf",
            upsert: true,
          })

        if (uploadError) {
          // If storage bucket doesn't exist yet, fall back to direct download
          console.warn("Storage upload failed, falling back to direct download:", uploadError.message)
          const url = URL.createObjectURL(blob)
          setPdfUrl(url)

          // Trigger direct download
          const a = window.document.createElement("a")
          a.href = url
          a.download = fileName || `${recordType}-${recordId}.pdf`
          window.document.body.appendChild(a)
          a.click()
          window.document.body.removeChild(a)

          toast.success("PDF generado correctamente")
          return url
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("reports")
          .getPublicUrl(path)

        const publicUrl = urlData?.publicUrl || null
        setPdfUrl(publicUrl)

        // Also trigger download
        const downloadUrl = URL.createObjectURL(blob)
        const a = window.document.createElement("a")
        a.href = downloadUrl
        a.download = fileName || `${recordType}-${recordId}.pdf`
        window.document.body.appendChild(a)
        a.click()
        window.document.body.removeChild(a)
        URL.revokeObjectURL(downloadUrl)

        toast.success("PDF generado y guardado correctamente")
        return publicUrl
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Error desconocido"
        toast.error(`Error al generar PDF: ${message}`)
        console.error("PDF generation error:", error)
        return null
      } finally {
        setGenerating(false)
      }
    },
    [organizationId, recordType, recordId, fileName]
  )

  const downloadPDF = useCallback(() => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank")
    }
  }, [pdfUrl])

  return {
    generating,
    pdfUrl,
    generatePDF,
    downloadPDF,
  }
}

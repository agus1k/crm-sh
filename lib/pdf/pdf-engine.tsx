"use client"

import React from "react"
import { Document, Page, View, Text } from "@react-pdf/renderer"
import type { Style } from "@react-pdf/types"
import { styles, colors, fonts } from "./pdf-styles"
import type { Organization, Profile, ProfessionalCredential } from "@/lib/crm-types"

// ─── PDFHeader ──────────────────────────────────────────────────────────────

interface PDFHeaderProps {
  organization: Organization
  professional?: Profile & { credentials?: ProfessionalCredential[] }
  title: string
  subtitle?: string
}

export function PDFHeader({
  organization,
  professional,
  title,
  subtitle,
}: PDFHeaderProps) {
  const primaryCredential = professional?.credentials?.find((c) => c.is_primary)

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.headerOrgName}>{organization.name}</Text>
        {organization.cuit && (
          <Text style={styles.headerOrgDetail}>
            CUIT: {organization.cuit}
          </Text>
        )}
        {organization.address && (
          <Text style={styles.headerOrgDetail}>{organization.address}</Text>
        )}
        {organization.phone && (
          <Text style={styles.headerOrgDetail}>
            Tel: {organization.phone}
          </Text>
        )}
        {organization.email && (
          <Text style={styles.headerOrgDetail}>{organization.email}</Text>
        )}
      </View>
      <View style={styles.headerRight}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
        {professional && (
          <View style={{ marginTop: 8 }}>
            <Text style={[styles.headerOrgDetail, { fontFamily: "Helvetica-Bold" }]}>
              {professional.full_name}
            </Text>
            {professional.matricula && (
              <Text style={styles.headerOrgDetail}>
                Mat. {professional.matricula}
              </Text>
            )}
            {primaryCredential && (
              <Text style={styles.headerOrgDetail}>
                {primaryCredential.jurisdiccion
                  ? `${primaryCredential.jurisdiccion} - `
                  : ""}
                N° {primaryCredential.numero}
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  )
}

// ─── PDFFooter ──────────────────────────────────────────────────────────────

interface PDFFooterProps {
  generatedAt?: string
  version?: number
}

export function PDFFooter({ generatedAt, version }: PDFFooterProps) {
  const dateStr =
    generatedAt ||
    new Date().toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

  return (
    <View style={styles.footer} fixed>
      <Text>Generado: {dateStr}</Text>
      {version && <Text>Versión: {version}</Text>}
      <Text
        render={({ pageNumber, totalPages }) =>
          `Página ${pageNumber} de ${totalPages}`
        }
      />
    </View>
  )
}

// ─── PDFTable ───────────────────────────────────────────────────────────────

interface PDFTableColumn {
  key: string
  header: string
  width?: string | number
  align?: "left" | "center" | "right"
  render?: (value: unknown, row: Record<string, unknown>, index: number) => React.ReactNode
}

interface PDFTableProps {
  columns: PDFTableColumn[]
  data: Record<string, unknown>[]
  showRowNumbers?: boolean
  footer?: React.ReactNode
}

function buildCellStyle(
  base: Style,
  col: PDFTableColumn
): Style[] {
  const s: Style[] = [base, col.width ? { width: col.width } : { flex: 1 }]
  if (col.align === "center") s.push(styles.textCenter as Style)
  if (col.align === "right") s.push(styles.textRight as Style)
  return s
}

export function PDFTable({
  columns,
  data,
  showRowNumbers = false,
  footer,
}: PDFTableProps) {
  return (
    <View style={styles.table}>
      {/* Header */}
      <View style={styles.tableHeader}>
        {showRowNumbers && (
          <Text style={[styles.tableHeaderCell as Style, { width: 30 }]}>#</Text>
        )}
        {columns.map((col) => (
          <Text
            key={col.key}
            style={buildCellStyle(styles.tableHeaderCell as Style, col)}
          >
            {col.header}
          </Text>
        ))}
      </View>

      {/* Body */}
      {data.map((row, rowIndex) => (
        <View
          key={rowIndex}
          style={rowIndex % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
          wrap={false}
        >
          {showRowNumbers && (
            <Text style={[styles.tableCell as Style, { width: 30 }]}>
              {rowIndex + 1}
            </Text>
          )}
          {columns.map((col) => (
            <Text
              key={col.key}
              style={buildCellStyle(styles.tableCell as Style, col)}
            >
              {col.render
                ? col.render(row[col.key], row, rowIndex)
                : String(row[col.key] ?? "-")}
            </Text>
          ))}
        </View>
      ))}

      {/* Footer */}
      {footer && (
        <View
          style={{
            flexDirection: "row",
            backgroundColor: colors.backgroundAlt,
            borderTopWidth: 1,
            borderTopColor: colors.primary,
          }}
        >
          {footer}
        </View>
      )}
    </View>
  )
}

// ─── PDFSignatureLine ───────────────────────────────────────────────────────

interface PDFSignatureLineProps {
  name: string
  role: string
  label?: string
}

export function PDFSignatureLine({ name, role, label }: PDFSignatureLineProps) {
  return (
    <View style={styles.signatureContainer}>
      {label && (
        <Text style={[styles.textXs, styles.textMuted, styles.mb4]}>
          {label}
        </Text>
      )}
      <View style={styles.signatureLine} />
      <Text style={styles.signatureName}>{name}</Text>
      <Text style={styles.signatureRole}>{role}</Text>
    </View>
  )
}

// ─── PDFInfoGrid ────────────────────────────────────────────────────────────

interface PDFInfoItem {
  label: string
  value: string | number | null | undefined
  fullWidth?: boolean
}

interface PDFInfoGridProps {
  items: PDFInfoItem[]
}

export function PDFInfoGrid({ items }: PDFInfoGridProps) {
  return (
    <View style={styles.infoGrid}>
      {items
        .filter((item) => item.value != null && item.value !== "")
        .map((item, i) => (
          <View
            key={i}
            style={item.fullWidth ? styles.infoItemFull : styles.infoItem}
          >
            <Text style={styles.infoLabel}>{item.label}:</Text>
            <Text style={styles.infoValue}>{String(item.value)}</Text>
          </View>
        ))}
    </View>
  )
}

// ─── PDFSummaryBox ──────────────────────────────────────────────────────────

interface PDFSummaryBoxProps {
  title: string
  children: React.ReactNode
}

export function PDFSummaryBox({ title, children }: PDFSummaryBoxProps) {
  return (
    <View style={styles.summaryBox}>
      <Text style={styles.summaryTitle}>{title}</Text>
      {children}
    </View>
  )
}

// ─── PDFNote ────────────────────────────────────────────────────────────────

interface PDFNoteProps {
  text: string
}

export function PDFNote({ text }: PDFNoteProps) {
  return (
    <View style={styles.noteBox}>
      <Text style={styles.noteText}>{text}</Text>
    </View>
  )
}

// ─── PDFBadge ───────────────────────────────────────────────────────────────

type BadgeVariant = "success" | "danger" | "warning" | "info"

interface PDFBadgeProps {
  text: string
  variant: BadgeVariant
}

const badgeStyleMap: Record<BadgeVariant, Style> = {
  success: { backgroundColor: "#dcfce7", color: colors.success } as Style,
  danger: { backgroundColor: "#fef2f2", color: colors.danger } as Style,
  warning: { backgroundColor: "#fffbeb", color: colors.warning } as Style,
  info: { backgroundColor: "#eff6ff", color: colors.info } as Style,
}

export function PDFBadge({ text, variant }: PDFBadgeProps) {
  return (
    <Text style={[styles.badge as Style, badgeStyleMap[variant]]}>{text}</Text>
  )
}

// ─── PDFSection ─────────────────────────────────────────────────────────────

interface PDFSectionProps {
  title: string
  children: React.ReactNode
}

export function PDFSection({ title, children }: PDFSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

// ─── PDFDocument wrapper ────────────────────────────────────────────────────

interface PDFDocumentWrapperProps {
  children: React.ReactNode
}

export function PDFDocumentWrapper({ children }: PDFDocumentWrapperProps) {
  return <Document>{children}</Document>
}

interface PDFPageWrapperProps {
  children: React.ReactNode
}

export function PDFPageWrapper({ children }: PDFPageWrapperProps) {
  return (
    <Page size="A4" style={styles.page}>
      {children}
    </Page>
  )
}

// ─── Utility: format date for PDFs ──────────────────────────────────────────

export function formatPDFDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-"
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

export function formatPDFDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "-"
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return dateStr
  }
}

// ─── Risk classification color helper ───────────────────────────────────────

export function getRiskBadgeVariant(
  clasificacion: string | null | undefined
): BadgeVariant {
  switch (clasificacion) {
    case "Tolerable":
      return "success"
    case "Moderado":
      return "warning"
    case "Importante":
      return "warning"
    case "Intolerable":
      return "danger"
    default:
      return "info"
  }
}

// ─── Compliance badge ───────────────────────────────────────────────────────

export function getComplianceBadge(
  cumple: boolean | null | undefined
): { text: string; variant: BadgeVariant } {
  if (cumple === true) return { text: "CUMPLE", variant: "success" }
  if (cumple === false) return { text: "NO CUMPLE", variant: "danger" }
  return { text: "N/A", variant: "info" }
}

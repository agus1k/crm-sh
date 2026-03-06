import { StyleSheet } from "@react-pdf/renderer"

// Color palette matching the app theme
export const colors = {
  primary: "#18181b", // zinc-900
  secondary: "#71717a", // zinc-500
  muted: "#a1a1aa", // zinc-400
  border: "#d4d4d8", // zinc-300
  background: "#ffffff",
  backgroundAlt: "#f4f4f5", // zinc-100
  success: "#16a34a", // green-600
  danger: "#dc2626", // red-600
  warning: "#d97706", // amber-600
  info: "#2563eb", // blue-600
  // Risk colors
  tolerable: "#16a34a",
  moderado: "#d97706",
  importante: "#ea580c",
  intolerable: "#dc2626",
}

export const fonts = {
  base: 9,
  sm: 8,
  xs: 7,
  lg: 11,
  xl: 14,
  "2xl": 18,
  "3xl": 22,
}

export const styles = StyleSheet.create({
  // Page
  page: {
    padding: 40,
    fontSize: fonts.base,
    fontFamily: "Helvetica",
    color: colors.primary,
    lineHeight: 1.4,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: "flex-end",
    maxWidth: 200,
  },
  headerLogo: {
    width: 60,
    height: 60,
    marginBottom: 4,
  },
  headerOrgName: {
    fontSize: fonts.xl,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  headerOrgDetail: {
    fontSize: fonts.sm,
    color: colors.secondary,
    marginBottom: 1,
  },
  headerTitle: {
    fontSize: fonts["2xl"],
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: fonts.lg,
    color: colors.secondary,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 25,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 6,
    fontSize: fonts.xs,
    color: colors.muted,
  },

  // Sections
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: fonts.lg,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionSubtitle: {
    fontSize: fonts.base,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
  },

  // Info grid (key-value pairs)
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  infoItem: {
    width: "50%",
    flexDirection: "row",
    marginBottom: 4,
    paddingRight: 8,
  },
  infoItemFull: {
    width: "100%",
    flexDirection: "row",
    marginBottom: 4,
  },
  infoLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: fonts.sm,
    color: colors.secondary,
    minWidth: 100,
  },
  infoValue: {
    fontSize: fonts.sm,
    flex: 1,
  },

  // Tables
  table: {
    width: "100%",
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    color: colors.background,
    fontFamily: "Helvetica-Bold",
    fontSize: fonts.sm,
  },
  tableHeaderCell: {
    padding: 6,
    color: colors.background,
    fontFamily: "Helvetica-Bold",
    fontSize: fonts.sm,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  tableRowAlt: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    backgroundColor: colors.backgroundAlt,
  },
  tableCell: {
    padding: 5,
    fontSize: fonts.sm,
  },
  tableCellBold: {
    padding: 5,
    fontSize: fonts.sm,
    fontFamily: "Helvetica-Bold",
  },

  // Signature
  signatureLine: {
    width: 200,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    marginTop: 40,
    marginBottom: 4,
    alignSelf: "center",
  },
  signatureContainer: {
    alignItems: "center",
    marginTop: 24,
  },
  signatureName: {
    fontSize: fonts.sm,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },
  signatureRole: {
    fontSize: fonts.xs,
    color: colors.secondary,
    textAlign: "center",
  },

  // Badges / status indicators
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: fonts.xs,
    fontFamily: "Helvetica-Bold",
  },
  badgeSuccess: {
    backgroundColor: "#dcfce7",
    color: colors.success,
  },
  badgeDanger: {
    backgroundColor: "#fef2f2",
    color: colors.danger,
  },
  badgeWarning: {
    backgroundColor: "#fffbeb",
    color: colors.warning,
  },
  badgeInfo: {
    backgroundColor: "#eff6ff",
    color: colors.info,
  },

  // Text utilities
  textCenter: {
    textAlign: "center",
  },
  textRight: {
    textAlign: "right",
  },
  textBold: {
    fontFamily: "Helvetica-Bold",
  },
  textMuted: {
    color: colors.secondary,
  },
  textSm: {
    fontSize: fonts.sm,
  },
  textXs: {
    fontSize: fonts.xs,
  },
  textLg: {
    fontSize: fonts.lg,
  },

  // Layout utilities
  row: {
    flexDirection: "row",
  },
  spaceBetween: {
    justifyContent: "space-between",
  },
  mb4: { marginBottom: 4 },
  mb8: { marginBottom: 8 },
  mb12: { marginBottom: 12 },
  mb16: { marginBottom: 16 },
  mt8: { marginTop: 8 },
  mt16: { marginTop: 16 },
  p8: { padding: 8 },

  // Summary box
  summaryBox: {
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: fonts.lg,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },

  // Observation / note
  noteBox: {
    backgroundColor: "#fffbeb",
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
    padding: 8,
    marginBottom: 8,
  },
  noteText: {
    fontSize: fonts.sm,
  },
})

"use client"

import { useEffect, useState } from "react"
import { Topbar } from "@/components/layout/topbar"
import { useAuthStore } from "@/lib/stores/auth-store"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Building2,
  UserCircle,
  Save,
  Loader2,
  Wrench,
  FileStack,
  Users,
} from "lucide-react"
import { toast } from "sonner"
import { CredentialsManager } from "@/components/settings/credentials-manager"
import { InstrumentManager } from "@/components/settings/instrument-manager"

export default function ConfiguracionPage() {
  const { profile, organization, setProfile, setOrganization } = useAuthStore()
  const [loadingOrg, setLoadingOrg] = useState(false)
  const [loadingProf, setLoadingProf] = useState(false)

  const [orgData, setOrgData] = useState({
    name: "",
    cuit: "",
    email: "",
    phone: "",
    address: "",
  })
  const [profData, setProfData] = useState({
    full_name: "",
    phone: "",
    matricula: "",
  })

  useEffect(() => {
    if (organization) {
      setOrgData({
        name: organization.name || "",
        cuit: organization.cuit || "",
        email: organization.email || "",
        phone: organization.phone || "",
        address: organization.address || "",
      })
    }
    if (profile) {
      setProfData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        matricula: profile.matricula || "",
      })
    }
  }, [organization, profile])

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!organization) return
    setLoadingOrg(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("organizations")
      .update(orgData)
      .eq("id", organization.id)
      .select()
      .single()
    if (error) {
      toast.error("Error al actualizar la organización")
    } else {
      setOrganization(data)
      toast.success("Organización actualizada")
    }
    setLoadingOrg(false)
  }

  const handleSaveProf = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setLoadingProf(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("profiles")
      .update(profData)
      .eq("id", profile.id)
      .select()
      .single()
    if (error) {
      toast.error("Error al actualizar el perfil")
    } else {
      setProfile(data)
      toast.success("Perfil actualizado")
    }
    setLoadingProf(false)
  }

  return (
    <>
      <Topbar
        title="Configuración"
        description="Gestioná los datos de tu empresa, perfil e instrumentos"
      />
      <div className="p-4 lg:p-6 max-w-4xl mx-auto">
        <Tabs defaultValue="perfil" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5">
            <TabsTrigger value="perfil" className="gap-2">
              <UserCircle className="h-4 w-4 hidden sm:block" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="organizacion" className="gap-2">
              <Building2 className="h-4 w-4 hidden sm:block" />
              Organización
            </TabsTrigger>
            <TabsTrigger value="instrumentos" className="gap-2">
              <Wrench className="h-4 w-4 hidden sm:block" />
              Instrumentos
            </TabsTrigger>
            <TabsTrigger
              value="plantillas"
              className="gap-2 hidden lg:flex"
              disabled
            >
              <FileStack className="h-4 w-4 hidden sm:block" />
              Plantillas
            </TabsTrigger>
            <TabsTrigger
              value="equipo"
              className="gap-2 hidden lg:flex"
              disabled
            >
              <Users className="h-4 w-4 hidden sm:block" />
              Equipo
            </TabsTrigger>
          </TabsList>

          {/* Tab: Perfil */}
          <TabsContent value="perfil" className="space-y-6">
            <section className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="bg-muted/30 px-6 py-4 border-b border-border flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">
                  Datos Personales
                </h2>
              </div>
              <form onSubmit={handleSaveProf} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Nombre completo</Label>
                    <Input
                      value={profData.full_name}
                      onChange={(e) =>
                        setProfData({ ...profData, full_name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Rol</Label>
                    <Input
                      value={profile?.role || ""}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Teléfono personal</Label>
                    <Input
                      value={profData.phone}
                      onChange={(e) =>
                        setProfData({ ...profData, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Matrícula / Registro</Label>
                    <Input
                      value={profData.matricula}
                      onChange={(e) =>
                        setProfData({ ...profData, matricula: e.target.value })
                      }
                      placeholder="Matrícula principal (legacy)"
                      className="text-muted-foreground"
                    />
                    <p className="text-xs text-muted-foreground">
                      Usá la sección de matrículas debajo para gestionar
                      múltiples registros.
                    </p>
                  </div>
                </div>
                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    disabled={loadingProf || !profData.full_name}
                  >
                    {loadingProf ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Guardar cambios
                  </Button>
                </div>
              </form>
            </section>

            <CredentialsManager />
          </TabsContent>

          {/* Tab: Organización */}
          <TabsContent value="organizacion" className="space-y-6">
            <section className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="bg-muted/30 px-6 py-4 border-b border-border flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">
                  Datos de la Organización
                </h2>
              </div>
              <form onSubmit={handleSaveOrg} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Nombre de fantasía</Label>
                    <Input
                      value={orgData.name}
                      onChange={(e) =>
                        setOrgData({ ...orgData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>CUIT</Label>
                    <Input
                      value={orgData.cuit}
                      onChange={(e) =>
                        setOrgData({ ...orgData, cuit: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email de contacto</Label>
                    <Input
                      type="email"
                      value={orgData.email}
                      onChange={(e) =>
                        setOrgData({ ...orgData, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Teléfono comercial</Label>
                    <Input
                      value={orgData.phone}
                      onChange={(e) =>
                        setOrgData({ ...orgData, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label>Dirección fiscal</Label>
                    <Input
                      value={orgData.address}
                      onChange={(e) =>
                        setOrgData({ ...orgData, address: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    disabled={loadingOrg || !orgData.name}
                  >
                    {loadingOrg ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Guardar cambios
                  </Button>
                </div>
              </form>
            </section>
          </TabsContent>

          {/* Tab: Instrumentos */}
          <TabsContent value="instrumentos">
            <InstrumentManager />
          </TabsContent>

          {/* Placeholder tabs for future features */}
          <TabsContent value="plantillas">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileStack className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground">
                Plantillas de Informes
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Próximamente podrás configurar plantillas para tus informes
                técnicos.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="equipo">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground">
                Gestión de Equipo
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Próximamente podrás invitar y gestionar miembros de tu equipo.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}

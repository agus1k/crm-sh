"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Mail, Lock, User, Building } from "lucide-react"
import Link from "next/link"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [orgName, setOrgName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: signUpError } = await supabase.auth.signUp({
      email, password, options: { data: { full_name: name, org_name: orgName } },
    })
    if (signUpError) { setError(signUpError.message); setLoading(false) } 
    else { setSuccess(true); setLoading(false) }
  }

  if (success) {
    return (
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-sm p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold text-foreground">¡Revisá tu email!</h2>
        <p className="text-muted-foreground text-sm">Te enviamos un enlace de confirmación. Hacé clic en el enlace para activar tu cuenta.</p>
        <div className="pt-4"><Link href="/login"><Button variant="outline" className="w-full">Volver al login</Button></Link></div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-sm p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Crear cuenta</h1>
        <p className="text-sm text-muted-foreground mt-2">Comenzá a gestionar tus informes hoy mismo</p>
      </div>
      <form onSubmit={handleRegister} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre real</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="name" placeholder="Juan Pérez" className="pl-9" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="orgName">Empresa</Label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="orgName" placeholder="Consultora SH" className="pl-9" value={orgName} onChange={(e) => setOrgName(e.target.value)} required />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="email" type="email" placeholder="tu@email.com" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="password" type="password" placeholder="••••••••" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
        </div>
        {error && <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">{error}</div>}
        <Button type="submit" className="w-full h-11 text-base font-medium mt-2" disabled={loading || !email || !password || !name || !orgName}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Registrarse
        </Button>
      </form>
      <div className="mt-6 text-center text-sm text-muted-foreground">
        ¿Ya tenés una cuenta? <Link href="/login" className="text-foreground font-medium hover:text-primary transition-colors">Ingresar</Link>
      </div>
    </div>
  )
}

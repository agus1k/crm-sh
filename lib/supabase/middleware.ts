import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const AUTH_PAGES = ["/login", "/register", "/auth"]
const PORTAL_PREFIX = "/portal"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session - do not add code between createServerClient and getUser
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p))
  const isPortalPage = pathname.startsWith(PORTAL_PREFIX)

  // Redirect unauthenticated users to login (except auth pages)
  if (!user && !isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages (role-aware)
  if (user && isAuthPage) {
    const role = await getUserRole(supabase, user.id)
    const url = request.nextUrl.clone()
    url.pathname = role === "cliente" ? "/portal" : "/"
    return NextResponse.redirect(url)
  }

  // Role-based route protection for authenticated users
  if (user && (isPortalPage || !isAuthPage)) {
    const role = await getUserRole(supabase, user.id)

    // Client users can only access /portal routes
    if (role === "cliente" && !isPortalPage) {
      const url = request.nextUrl.clone()
      url.pathname = "/portal"
      return NextResponse.redirect(url)
    }

    // Admin/tecnico users should not access /portal routes
    if (role !== "cliente" && isPortalPage) {
      const url = request.nextUrl.clone()
      url.pathname = "/"
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

/**
 * Get the user's role from the profiles table.
 * Returns null if profile not found (new user without profile yet).
 */
async function getUserRole(
  supabase: ReturnType<typeof createServerClient>,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single()
  return data?.role ?? null
}

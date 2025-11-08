'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  Loader2, 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut,
  Building, // Para Escolas
  Briefcase, // Para Empresas
  User, // Para Alunos
  BookOpen, // Para Módulos
  Newspaper, // Para Novidades
  Award, // Para Conquistas
  PenSquare, // Para Write
  Gamepad2 // Para Games
} from 'lucide-react'
import clsx from 'clsx'

// --- Componente da Sidebar do Admin (Nova Versão) ---

// Define a estrutura de um link da sidebar
interface NavLink {
  href: string
  label: string
  icon: React.ElementType
}

// Define as seções de navegação
const navigationSections = [
  {
    links: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ]
  },
  {
    title: 'Gestão de Usuários',
    links: [
      { href: '/dashboard/alunos', label: 'Alunos', icon: User },
      { href: '/dashboard/professores', label: 'Professores', icon: Users },
      { href: '/dashboard/empresas', label: 'Empresas', icon: Briefcase },
    ]
  },
  {
    title: 'Gestão de Conteúdo',
    links: [
      { href: '/dashboard/escolas', label: 'Instituições', icon: Building },
      { href: '/dashboard/novidades', label: 'Novidades do Hub', icon: Newspaper },
      { href: '/dashboard/conquistas', label: 'Conquistas', icon: Award },
    ]
  },
  {
    title: 'Módulos (Super Acesso)',
    links: [
      { href: '/dashboard/modulos/write', label: 'Facillit Write', icon: PenSquare },
      { href: '/dashboard/modulos/games', label: 'Facillit Games', icon: Gamepad2 },
      // Adicione outros módulos aqui
    ]
  },
]

// Componente de Link reutilizável
function NavItem({ href, label, icon: Icon }: NavLink) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={clsx(
        "flex items-center gap-3 rounded-md px-3 py-2 text-gray-700 transition-colors",
        isActive 
          ? "bg-blue-100 text-blue-700 font-medium" 
          : "hover:bg-gray-100"
      )}
    >
      <Icon className={clsx("h-5 w-5", isActive ? "text-blue-600" : "text-gray-500")} />
      <span>{label}</span>
    </Link>
  )
}

function AdminSidebar() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/') // Leva para a página de login
  }

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-white">
      <div className="flex h-16 items-center justify-center border-b px-4">
        <span className="text-xl font-bold text-gray-900">
          Facillit
          <span className="text-blue-600">Admin</span>
        </span>
      </div>
      
      <nav className="flex-1 space-y-4 overflow-y-auto p-4">
        {navigationSections.map((section, index) => (
          <div key={index}>
            {section.title && (
              <h3 className="mb-2 mt-4 px-3 text-xs font-semibold uppercase text-gray-400">
                {section.title}
              </h3>
            )}
            <div className="space-y-1">
              {section.links.map((link) => (
                <NavItem key={link.href} {...link} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto border-t p-4 space-y-1">
        <Link
          href="/dashboard/configuracoes"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100"
        >
          <Settings className="h-5 w-5 text-gray-500" />
          <span>Configurações</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100"
        >
          <LogOut className="h-5 w-5 text-red-500" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  )
}

// --- O "Porteiro" (Gatekeeper Layout) ---
export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (profile && profile.is_admin === true) {
        setIsLoading(false)
      } else {
        await supabase.auth.signOut()
        router.push('/?error=Acesso negado. Você não é um administrador.')
      }
    }
    checkAdminStatus()
  }, [supabase, router])

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-100">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <span className="ml-4 text-lg text-gray-700">Verificando permissões...</span>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  )
}
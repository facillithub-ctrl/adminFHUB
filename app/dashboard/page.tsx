'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
// =======================================
// CORREÇÃO AQUI
// =======================================
import { Users, School, BookOpen, Newspaper, Settings } from 'lucide-react'
// =======================================
import Link from 'next/link'

// Card de Estatística
function StatCard({ title, value, icon: Icon }: { title: string, value: string, icon: React.ElementType }) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="rounded-full bg-blue-100 p-3">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
      </div>
    </div>
  )
}

// Página Principal do Dashboard
export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ totalAlunos: '0', totalEscolas: '0' })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchStats = async () => {
      // Como somos admin, podemos fazer essas queries
      const { count: alunosCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true }) // 'head: true' é mais rápido
        .eq('user_role', 'student')

      // (Assumindo que você terá uma tabela 'escolas' no futuro)
      // const { count: escolasCount } = await supabase
      //   .from('escolas')
      //   .select('*', { count: 'exact', head: true })

      setStats({
        totalAlunos: String(alunosCount ?? 0),
        totalEscolas: '0', // Substitua por escolasCount ?? 0
      })
      setLoading(false)
    }
    
    fetchStats()
  }, [])

  if (loading) {
    return <div>Carregando estatísticas...</div>
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard de Administrador</h1>
      
      {/* Seção de Estatísticas */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total de Alunos" value={stats.totalAlunos} icon={Users} />
        <StatCard title="Total de Escolas" value={stats.totalEscolas} icon={School} />
        <StatCard title="Redações Corrigidas" value="0" icon={BookOpen} />
        <StatCard title="Novidades Publicadas" value="0" icon={Newspaper} />
      </div>

      {/* Seção de Atalhos */}
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-xl font-semibold">Atalhos Rápidos</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Link href="/dashboard/alunos" className="rounded-lg bg-blue-50 p-4 text-center text-blue-700 transition hover:bg-blue-100">
            <Users className="mx-auto h-8 w-8" />
            <span className="mt-2 block font-medium">Gerenciar Alunos</span>
          </Link>
          <Link href="#" className="rounded-lg bg-gray-50 p-4 text-center text-gray-700 transition hover:bg-gray-100">
            <School className="mx-auto h-8 w-8" />
            <span className="mt-2 block font-medium">Gerenciar Escolas</span>
          </Link>
          <Link href="#" className="rounded-lg bg-gray-50 p-4 text-center text-gray-700 transition hover:bg-gray-100">
            <Newspaper className="mx-auto h-8 w-8" />
            <span className="mt-2 block font-medium">Publicar Novidades</span>
          </Link>
          <Link href="#" className="rounded-lg bg-gray-50 p-4 text-center text-gray-700 transition hover:bg-gray-100">
            <Settings className="mx-auto h-8 w-8" />
            <span className="mt-2 block font-medium">Configurações</span>
          </Link>
        </div>
      </div>
      
      {/* Mais seções aqui (ex: Publicar Novidades, Criar Conquistas, etc.) */}
      
    </div>
  )
}
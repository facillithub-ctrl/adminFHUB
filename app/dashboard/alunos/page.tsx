'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useMemo, Fragment } from 'react'
import {
  Loader2,
  UserCheck,
  ShieldOff,
  Trash2,
  Eye,
  Search,
  Filter,
  Users,
  BarChart3,
  LogIn,
  Check,
  ChevronDown,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'
import { Listbox, Transition } from '@headlessui/react' // Para o Filtro
import { motion, AnimatePresence } from 'framer-motion' // Para animações

// (A interface deve corresponder à sua tabela 'profiles')
interface AlunoProfile {
  id: string
  user_id: number
  full_name: string
  nickname: string
  created_at: string
  is_verified: boolean
  address_city: string
  address_state: string
  // (O email está na tabela 'auth.users', que não é publicamente legível)
}

// Opções do Filtro
const filterOptions = [
  { id: 'all', name: 'Todos' },
  { id: 'verified', name: 'Verificados' },
  { id: 'unverified', name: 'Não Verificados' },
]

// Card de Estatística
const StatCard = ({ title, value, icon: Icon }: { title: string, value: string, icon: React.ElementType }) => (
  <div className="rounded-lg bg-white p-5 shadow-md">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div className="rounded-full bg-blue-100 p-3">
        <Icon className="h-6 w-6 text-blue-600" />
      </div>
    </div>
    {/* Placeholder para mini-gráfico */}
    <div className="mt-4 h-8 w-full rounded-full bg-gray-100">
      <div className="h-8 rounded-full bg-blue-300" style={{ width: `${Math.random() * 50 + 25}%` }} />
    </div>
  </div>
)

export default function AdminAlunosPage() {
  const [alunos, setAlunos] = useState<AlunoProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // --- Estados para Filtro e Busca ---
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState(filterOptions[0])
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const fetchAlunos = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, nickname, created_at, is_verified, address_city, address_state')
        .or('user_role.eq.student,user_role.eq.access_code_user')
        .order('created_at', { ascending: false })

      if (error) {
        console.error(error)
        setError('Falha ao buscar alunos. Verifique as permissões RLS.')
      } else if (data) {
        setAlunos(data as any)
      }
      setLoading(false)
    }
    fetchAlunos()
  }, [])

  // --- Lógica de Filtro ---
  const filteredAlunos = useMemo(() => {
    return alunos
      .filter((aluno) => {
        // Filtro de Status
        if (selectedFilter.id === 'verified') return aluno.is_verified
        if (selectedFilter.id === 'unverified') return !aluno.is_verified
        return true // 'all'
      })
      .filter((aluno) => {
        // Filtro de Busca
        const query = searchQuery.toLowerCase()
        return (
          aluno.full_name?.toLowerCase().includes(query) ||
          aluno.nickname?.toLowerCase().includes(query) ||
          String(aluno.user_id).includes(query)
        )
      })
  }, [alunos, searchQuery, selectedFilter])

  // --- Funções de Ação ---
  const handleVerify = async (id: string, currentState: boolean) => {
    const newState = !currentState
    const actionText = newState ? "verificar" : "remover a verificação de";
    if (!window.confirm(`Tem certeza que deseja ${actionText} este aluno?`)) return

    const { error } = await supabase.from('profiles').update({ is_verified: newState }).eq('id', id)
    if (error) {
      setError(error.message)
    } else {
      setAlunos(alunos.map(aluno => 
        aluno.id === id ? { ...aluno, is_verified: newState } : aluno
      ))
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`ATENÇÃO: Isso é irreversível.\nTem certeza que deseja apagar o perfil de "${name}"?`)) return

    const { error } = await supabase.from('profiles').delete().eq('id', id)
    if (error) {
      setError(error.message)
    } else {
      setAlunos(alunos.filter(aluno => aluno.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Gerenciar Alunos</h1>
      
      {/* --- Seção de Estatísticas --- */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total de Alunos" value={String(alunos.length)} icon={Users} />
        <StatCard 
          title="Alunos Verificados" 
          value={String(alunos.filter(a => a.is_verified).length)} 
          icon={UserCheck} 
        />
        <StatCard title="Frequência Média" value="N/A" icon={BarChart3} />
        <StatCard title="Ativos Hoje" value="N/A" icon={LogIn} />
      </div>
      
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      {/* --- Seção de Filtros e Tabela --- */}
      <div className="overflow-hidden rounded-lg bg-white shadow-md">
        
        {/* Barra de Filtro e Busca */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 border-b border-gray-200">
          <div className="relative w-full md:w-1/2 lg:w-1/3">
            <input
              type="text"
              placeholder="Buscar por nome, apelido ou UserID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border-gray-300 pl-10 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          <div className="relative w-full md:w-auto">
            <Listbox value={selectedFilter} onChange={setSelectedFilter}>
              <div className="relative">
                <Listbox.Button className="relative w-full md:w-56 cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <span className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <span className="block truncate">{selectedFilter.name}</span>
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  </span>
                </Listbox.Button>
                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                  <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none">
                    {filterOptions.map((option) => (
                      <Listbox.Option
                        key={option.id}
                        className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${ active ? 'bg-blue-100 text-blue-900' : 'text-gray-900' }`}
                        value={option}
                      >
                        {({ selected }) => (
                          <>
                            <span className={`block truncate ${ selected ? 'font-medium' : 'font-normal' }`}>{option.name}</span>
                            {selected ? (<span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600"><Check className="h-5 w-5" /></span>) : null}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
          </div>
        </div>

        {/* Tabela de Alunos */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">UserID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Localização</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Selo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Último Acesso</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequência</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <AnimatePresence>
                {filteredAlunos.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      Nenhum aluno encontrado para os filtros aplicados.
                    </td>
                  </tr>
                )}
                {filteredAlunos.map((aluno) => (
                  <motion.tr 
                    key={aluno.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      FH{String(aluno.user_id).padStart(6, '0')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{aluno.full_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {aluno.address_city || 'N/A'}, {aluno.address_state || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {aluno.is_verified ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          <UserCheck className="mr-1.5 h-4 w-4" />
                          Verificado
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                          Não verificado
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">N/A</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">N/A</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <Link 
                        href={`/dashboard/alunos/${aluno.id}`} 
                        className="text-gray-500 hover:text-blue-600"
                        title="Ver Ficha Completa"
                      >
                        <Eye className="h-5 w-5 inline-block" />
                      </Link>
                      <button
                        onClick={() => handleVerify(aluno.id, aluno.is_verified)}
                        className={clsx(
                          "hover:text-white p-1 rounded",
                          aluno.is_verified 
                            ? "text-yellow-600 hover:bg-yellow-600" 
                            : "text-green-600 hover:bg-green-600"
                        )}
                        title={aluno.is_verified ? "Remover Selo" : "Verificar Aluno (Selo)"}
                      >
                        {aluno.is_verified ? <ShieldOff className="h-5 w-5 inline-block" /> : <UserCheck className="h-5 w-5 inline-block" />}
                      </button>
                      <button
                        onClick={() => handleDelete(aluno.id, aluno.full_name)}
                        className="text-gray-500 hover:text-red-600"
                        title="Apagar Aluno"
                      >
                        <Trash2 className="h-5 w-5 inline-block" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
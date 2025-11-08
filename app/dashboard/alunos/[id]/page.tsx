'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { Loader2, ArrowLeft, UserCheck } from 'lucide-react'
import Link from 'next/link'
// import { ProfileData } from '@/app/dashboard/aluno/ProfileContext' // <-- LINHA REMOVIDA

// Helper para exibir os dados
const InfoItem = ({ label, value }: { label: string, value: string | string[] | boolean | number | null }) => {
  let displayValue = value;

  if (typeof value === 'boolean') {
    displayValue = value ? 'Sim' : 'Não'
  }
  if (Array.isArray(value)) {
    displayValue = value.join(', ') || 'Nenhum'
  }
  if (!value && typeof value !== 'boolean' && value !== 0) { // Adicionado check para '0'
    displayValue = 'Não preenchido'
  }

  return (
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{String(displayValue)}</dd>
    </div>
  )
}

// A interface local que a página usa.
interface AlunoProfile {
  id: string
  user_id: number
  full_name: string
  nickname: string
  date_of_birth: string
  pronoun: string
  cpf: string
  address_cep: string
  address_street: string
  address_number: string
  address_city: string
  address_state: string
  address_country: string
  education_level: string
  course: string
  education_year: string
  institution: string
  selected_modules: string[]
  theme: string
  font_size: string
  is_verified: boolean
  created_at: string
}

export default function AlunoFichaPage({ params }: { params: { id: string } }) {
  const [aluno, setAluno] = useState<AlunoProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!params.id) return;

    const fetchAluno = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*') // Pega tudo do perfil
        .eq('id', params.id) // Onde o ID é o da URL
        .single()

      if (error) {
        console.error(error)
        setError('Falha ao buscar dados do aluno.')
      } else if (data) {
        setAluno(data as any)
      }
      setLoading(false)
    }
    fetchAluno()
  }, [params.id, supabase]) // Adicionado supabase como dependência

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (error || !aluno) {
    return (
      <div>
        <Link href="/dashboard/alunos" className="flex items-center gap-2 text-blue-600 hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Voltar para Alunos
        </Link>
        <div className="rounded-md bg-red-50 p-4 mt-4">
          <p className="text-sm font-medium text-red-700">{error || 'Aluno não encontrado.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/alunos" className="flex items-center gap-2 text-blue-600 hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Voltar para a lista
      </Link>

      <div className="overflow-hidden rounded-lg bg-white shadow-md">
        <div className="bg-white p-6">
          <h2 className="text-2xl font-bold text-gray-900">{aluno.full_name}</h2>
          <p className="text-gray-500">FH{String(aluno.user_id).padStart(6, '0')}</p>
          {aluno.is_verified && (
            <span className="mt-2 inline-flex items-center rounded-full bg-green-100 px-3 py-0.5 text-sm font-medium text-green-800">
              <UserCheck className="mr-1.5 h-4 w-4" />
              Verificado
            </span>
          )}
        </div>

        <div className="border-t border-gray-200 p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem label="Apelido" value={aluno.nickname} />
            <InfoItem label="Data de Nasc." value={aluno.date_of_birth ? new Date(aluno.date_of_birth).toLocaleDateString('pt-BR') : null} />
            <InfoItem label="Pronome" value={aluno.pronoun} />
            <InfoItem label="CPF" value={aluno.cpf} />
            
            <div className="sm:col-span-3"><hr/></div>
            
            <InfoItem label="Nível Educacional" value={aluno.education_level} />
            <InfoItem label="Curso" value={aluno.course} />
            <InfoItem label="Ano" value={aluno.education_year} />
            <InfoItem label="Instituição" value={aluno.institution} />
            
            <div className="sm:col-span-3"><hr/></div>

            <InfoItem label="Endereço" value={`${aluno.address_street || ''}, ${aluno.address_number || ''}`} />
            <InfoItem label="Cidade" value={aluno.address_city} />
            <InfoItem label="Estado" value={aluno.address_state} />
            <InfoItem label="CEP" value={aluno.address_cep} />
            <InfoItem label="País" value={aluno.address_country} />

            <div className="sm:col-span-3"><hr/></div>

            <InfoItem label="Módulos Selecionados" value={aluno.selected_modules} />
            <InfoItem label="Tema" value={aluno.theme} />
            <InfoItem label="Tam. Fonte" value={aluno.font_size} />
            <InfoItem label="Data de Cadastro" value={new Date(aluno.created_at).toLocaleString('pt-BR')} />
          </dl>
        </div>
      </div>
    </div>
  )
}
'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, Fragment } from 'react'
import {
  Loader2, Trash2, Edit, Plus, X,
  // Biblioteca expandida de Ícones
  Award, Star, Zap, BookOpen, Target, Trophy, Flame, Crown, Lightbulb, 
  GraduationCap, Rocket, Medal, Map, Flag, CheckCircle2, Puzzle, Timer
} from 'lucide-react'
import { Dialog, Transition, RadioGroup } from '@headlessui/react'
import clsx from 'clsx'

// --- 1. Configuração de Ícones (Expandida) ---
const ICON_MAP: Record<string, React.ElementType> = {
  Award, Star, Zap, BookOpen, Target, Trophy, Flame, Crown, 
  Lightbulb, GraduationCap, Rocket, Medal, Map, Flag, CheckCircle2, Puzzle, Timer
}
const ICON_KEYS = Object.keys(ICON_MAP)

// --- 2. Tipos de Métricas Avançadas ---
type MetricType = 'numeric' | 'boolean'

interface MetricDefinition {
  key: string
  label: string
  unit: string
  description: string
  type: MetricType
}

const PREDEFINED_METRICS: MetricDefinition[] = [
  // Métricas Numéricas
  { 
    key: 'study_hours', 
    label: '⏱️ Tempo de Estudo', 
    unit: 'horas', 
    type: 'numeric',
    description: 'Soma total de horas estudadas na plataforma.' 
  },
  { 
    key: 'courses_completed', 
    label: '📚 Cursos Concluídos', 
    unit: 'cursos', 
    type: 'numeric',
    description: 'Quantidade total de cursos com 100% de progresso.' 
  },
  { 
    key: 'login_streak', 
    label: '🔥 Ofensiva (Dias)', 
    unit: 'dias seguidos', 
    type: 'numeric',
    description: 'Dias consecutivos acessando a plataforma.' 
  },
  { 
    key: 'forum_posts', 
    label: '💬 Posts no Fórum', 
    unit: 'posts', 
    type: 'numeric',
    description: 'Total de interações (tópicos ou respostas) no fórum.' 
  },
  { 
    key: 'games_played', 
    label: '🎮 Jogos Finalizados', 
    unit: 'partidas', 
    type: 'numeric',
    description: 'Vezes que o aluno completou um jogo educacional.' 
  },
  // Métricas Booleanas (Status)
  {
    key: 'onboarding_completed',
    label: '🏁 Completou Onboarding',
    unit: 'status',
    type: 'boolean',
    description: 'Se o aluno finalizou o tour inicial de boas-vindas.'
  },
  {
    key: 'profile_completed',
    label: '👤 Perfil Completo',
    unit: 'status',
    type: 'boolean',
    description: 'Se o aluno preencheu todos os dados opcionais do perfil.'
  }
]

// --- Interfaces & Estado Inicial ---
interface Conquista {
  id: number
  created_at: string
  title: string
  description: string
  icon_name: string
  metric_name: string
  metric_target: number
  is_active: boolean
}

type ConquistaForm = Omit<Conquista, 'id' | 'created_at'>

const initialState: ConquistaForm = {
  title: '',
  description: '',
  icon_name: 'Award',
  metric_name: PREDEFINED_METRICS[0].key,
  metric_target: 10,
  is_active: true,
}

// Componente Helper para Ícone
const DynamicIcon = ({ name, className }: { name: string, className?: string }) => {
  const Icon = ICON_MAP[name] || Award
  return <Icon className={className} />
}

export default function ConquistasPage() {
  const [conquistas, setConquistas] = useState<Conquista[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [currentConquista, setCurrentConquista] = useState<Conquista | null>(null)
  const [formData, setFormData] = useState<ConquistaForm>(initialState)

  const supabase = createClient()

  // --- Data Fetching ---
  const fetchConquistas = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('conquistas')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      setError('Falha ao buscar conquistas.')
    } else if (data) {
      setConquistas(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchConquistas()
  }, [])

  // --- Modal Handlers ---
  const clearMessages = () => { setError(null); setSuccess(null) }

  const openModalToCreate = () => {
    clearMessages()
    setCurrentConquista(null)
    setFormData(initialState)
    setIsModalOpen(true)
  }

  const openModalToEdit = (conquista: Conquista) => {
    clearMessages()
    setCurrentConquista(conquista)
    setFormData({
      title: conquista.title,
      description: conquista.description,
      icon_name: conquista.icon_name,
      metric_name: conquista.metric_name,
      metric_target: conquista.metric_target,
      is_active: conquista.is_active,
    })
    setIsModalOpen(true)
  }

  const closeModal = () => { setIsModalOpen(false); setIsSaving(false) }

  // --- CRUD Operations ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    clearMessages()

    if (!formData.title.trim() || !formData.description.trim()) {
      setError("Título e descrição são obrigatórios.")
      setIsSaving(false)
      return
    }

    const payload = { ...formData }

    // Se for booleano, garante que o target é 0 ou 1
    const selectedMetric = PREDEFINED_METRICS.find(m => m.key === formData.metric_name)
    if (selectedMetric?.type === 'boolean') {
        // Garante que seja 1 (Sim) ou 0 (Não)
        payload.metric_target = payload.metric_target ? 1 : 0;
    }

    try {
      const query = currentConquista
        ? supabase.from('conquistas').update(payload).eq('id', currentConquista.id)
        : supabase.from('conquistas').insert(payload)

      const { error: saveError } = await query
      if (saveError) throw saveError

      setSuccess(currentConquista ? 'Conquista atualizada!' : 'Conquista criada!')
      await fetchConquistas()
      closeModal()
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza? A definição será apagada, mas usuários que já ganharam manterão o registro.')) return
    const { error } = await supabase.from('conquistas').delete().eq('id', id)
    if (!error) {
      setSuccess('Conquista removida.')
      fetchConquistas()
    } else {
        setError('Erro ao apagar.')
    }
  }

  // Helper para encontrar a métrica atual selecionada no formulário
  const selectedMetricInfo = PREDEFINED_METRICS.find(m => m.key === formData.metric_name)

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Conquistas</h1>
          <p className="mt-1 text-gray-600">Define as regras para gamificação da plataforma.</p>
        </div>
        <button
          onClick={openModalToCreate}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="h-5 w-5" />
          Nova Conquista
        </button>
      </div>

      {/* Feedback Messages */}
      {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border-l-4 border-red-500">{error}</div>}
      {success && <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700 border-l-4 border-green-500">{success}</div>}

      {/* Tabela Principal */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Ícone</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Conquista</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Regra de Ativação</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr><td colSpan={5} className="p-12 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-blue-500/50"/></td></tr>
              ) : conquistas.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-gray-500">Nenhuma conquista encontrada. Comece criando uma!</td></tr>
              ) : (
                conquistas.map((c) => {
                  const metric = PREDEFINED_METRICS.find(m => m.key === c.metric_name)
                  // Formatação inteligente da meta na tabela
                  const targetDisplay = metric?.type === 'boolean' 
                    ? (c.metric_target === 1 ? 'Sim (Concluído)' : 'Não')
                    : `${c.metric_target} ${metric?.unit || ''}`

                  return (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={clsx(
                            "flex h-12 w-12 items-center justify-center rounded-full border-2",
                            c.is_active ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-gray-100 border-gray-200 text-gray-400"
                        )}>
                          <DynamicIcon name={c.icon_name} className="h-6 w-6" />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">{c.title}</span>
                          <span className="text-sm text-gray-500 line-clamp-1" title={c.description}>{c.description}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">{metric?.label || c.metric_name}</span>
                            <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full w-fit mt-1">
                                <Target className="w-3 h-3" />
                                Meta: {targetDisplay}
                            </span>
                         </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium', 
                          c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        )}>
                          <span className={clsx("h-1.5 w-1.5 rounded-full", c.is_active ? "bg-green-500" : "bg-gray-500")} />
                          {c.is_active ? 'Ativa' : 'Rascunho'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                            <button onClick={() => openModalToEdit(c)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"><Edit className="h-5 w-5" /></button>
                            <button onClick={() => handleDelete(c.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"><Trash2 className="h-5 w-5" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Modal Otimizado --- */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl">
                    
                  {/* Header do Modal */}
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      {currentConquista ? 'Editar Conquista' : 'Criar Nova Conquista'}
                    </Dialog.Title>
                    <button onClick={closeModal} className="text-gray-400 hover:text-gray-500 transition">
                        <X className="h-6 w-6" />
                    </button>
                  </div>

                  {/* Corpo do Form */}
                  <form onSubmit={handleSave} className="p-6 space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        
                        {/* Coluna Esquerda: Identidade Visual (Ícone) - Ocupa 4/12 */}
                        <div className="lg:col-span-4 space-y-6">
                             <fieldset>
                                <legend className="text-sm font-semibold text-gray-900 mb-3">Identidade Visual</legend>
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 h-[420px] overflow-y-auto custom-scrollbar">
                                    <RadioGroup value={formData.icon_name} onChange={(val) => setFormData({...formData, icon_name: val})}>
                                        <RadioGroup.Label className="sr-only">Escolha um ícone</RadioGroup.Label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {ICON_KEYS.map((iconKey) => (
                                                <RadioGroup.Option
                                                    key={iconKey}
                                                    value={iconKey}
                                                    className={({ active, checked }) =>
                                                        clsx(
                                                            "aspect-square cursor-pointer rounded-xl flex flex-col items-center justify-center border-2 transition-all duration-200",
                                                            checked 
                                                                ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm' 
                                                                : 'bg-white border-gray-200 text-gray-400 hover:border-blue-200 hover:bg-blue-50/50',
                                                        )
                                                    }
                                                >
                                                    <DynamicIcon name={iconKey} className="h-8 w-8 mb-1" />
                                                    <span className="text-[10px] opacity-60">{iconKey}</span>
                                                </RadioGroup.Option>
                                            ))}
                                        </div>
                                    </RadioGroup>
                                </div>
                             </fieldset>
                        </div>

                        {/* Coluna Direita: Dados & Regras - Ocupa 8/12 */}
                        <div className="lg:col-span-8 space-y-8">
                            
                            {/* Grupo 1: Informações Básicas */}
                            <fieldset className="space-y-4">
                                <legend className="text-sm font-semibold text-gray-900 border-b pb-2 w-full mb-4">Informações Básicas</legend>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Título da Conquista</label>
                                        <input
                                            type="text"
                                            required
                                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                            placeholder="Ex: Mestre da Matemática"
                                            value={formData.title}
                                            onChange={e => setFormData({...formData, title: e.target.value})}
                                        />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Descrição (visível ao aluno)</label>
                                        <textarea
                                            required
                                            rows={2}
                                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm resize-none"
                                            placeholder="Ex: Complete 10 exercícios de matemática sem errar."
                                            value={formData.description}
                                            onChange={e => setFormData({...formData, description: e.target.value})}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Status</label>
                                        <select
                                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                            value={String(formData.is_active)}
                                            onChange={e => setFormData({...formData, is_active: e.target.value === 'true'})}
                                        >
                                            <option value="true">🟢 Ativa (Visível)</option>
                                            <option value="false">⚪ Rascunho (Oculta)</option>
                                        </select>
                                    </div>
                                </div>
                            </fieldset>

                            {/* Grupo 2: Motor de Regras */}
                            <fieldset className="space-y-4">
                                <legend className="text-sm font-semibold text-gray-900 border-b pb-2 w-full mb-4 flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-yellow-500" />
                                    Regras de Ativação (Lógica)
                                </legend>

                                <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100 space-y-6">
                                    
                                    {/* Seletor de Métrica */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-900 mb-1">Qual gatilho ativa essa conquista?</label>
                                        <select
                                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                            value={formData.metric_name}
                                            onChange={e => setFormData({...formData, metric_name: e.target.value})}
                                        >
                                            {PREDEFINED_METRICS.map(metric => (
                                                <option key={metric.key} value={metric.key}>
                                                    {metric.label}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="mt-2 text-xs text-blue-700 flex items-start gap-1.5">
                                            <span className="font-semibold">ℹ️ Lógica:</span> 
                                            {selectedMetricInfo?.description}
                                        </p>
                                    </div>

                                    {/* Seletor de Meta Dinâmico */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-900 mb-1">
                                            Defina a Meta ({selectedMetricInfo?.unit})
                                        </label>
                                        
                                        {/* RENDERIZAÇÃO CONDICIONAL DO INPUT DE META */}
                                        {selectedMetricInfo?.type === 'boolean' ? (
                                            // Input para Métricas Booleanas (Sim/Não)
                                            <div className="flex items-center gap-4">
                                                 <label className={clsx(
                                                    "flex-1 relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none",
                                                    formData.metric_target === 1 ? "bg-blue-50 border-blue-500 ring-1 ring-blue-500" : "bg-white border-gray-300"
                                                 )}>
                                                    <input 
                                                        type="radio" name="metric_target_bool" className="sr-only" 
                                                        checked={formData.metric_target === 1}
                                                        onChange={() => setFormData({...formData, metric_target: 1})}
                                                    />
                                                    <span className="flex flex-1">
                                                        <span className="flex flex-col">
                                                            <span className="block text-sm font-medium text-gray-900">Sim, completou</span>
                                                            <span className="mt-1 flex items-center text-xs text-gray-500">Ganha ao finalizar a ação.</span>
                                                        </span>
                                                    </span>
                                                    <CheckCircle2 className={clsx("h-5 w-5", formData.metric_target === 1 ? "text-blue-600" : "text-gray-400")} />
                                                 </label>
                                                 
                                                 {/* Opção 'Não' raramente usada, mas bom ter para lógica reversa se necessário no futuro */}
                                                 {/* <label ...> Não </label> */}
                                            </div>
                                        ) : (
                                            // Input para Métricas Numéricas
                                            <div className="relative mt-1 rounded-md shadow-sm max-w-xs">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    required
                                                    className="block w-full rounded-lg border-gray-300 pr-16 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                                    placeholder="0"
                                                    value={formData.metric_target}
                                                    onChange={e => setFormData({...formData, metric_target: parseInt(e.target.value) || 0})}
                                                />
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                                    <span className="text-gray-500 sm:text-sm">{selectedMetricInfo?.unit}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </fieldset>
                        </div>
                    </div>

                    {/* Footer do Modal com Botões */}
                    <div className="mt-8 pt-5 border-t border-gray-200 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex items-center justify-center min-w-[120px] rounded-lg border border-transparent bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                      >
                        {isSaving ? <Loader2 className="animate-spin h-5 w-5" /> : (currentConquista ? 'Salvar Alterações' : 'Criar Conquista')}
                      </button>
                    </div>

                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  )
}
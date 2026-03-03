'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Search, Plus, RefreshCw, Edit, Ban, LayoutDashboard, FileText, Users, Settings, X } from 'lucide-react'

export default function GestaoUsuarios() {
  // Estados da Tabela
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Estados do Modal de Cadastro
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    id: '', nome: '', email: '', perfil: 'Usuário', setor: '', telefone: '', status: 'Ativo'
  })

  // A ponte para a sua planilha da sede
  const GOOGLE_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwhJMeVeTUxHX_X6mJTfgDGrtYvoXbIb2YNDuC7Phlum_tsWfjcCPXp4lY5wNcW5e4/exec'

  // Busca os dados do Supabase
  async function carregarUsuarios() {
    setLoading(true)
    const { data, error } = await supabase
      .from('sys_usuarios')
      .select('*')
      .order('nome', { ascending: true })
    
    if (data) setUsuarios(data)
    setLoading(false)
  }

  useEffect(() => {
    carregarUsuarios()
  }, [])

  // Função que Salva (Supabase + Planilha)
  // --- INÍCIO DO NOVO BLOCO LÓGICO ---
  async function salvarUsuario() {
    if (!formData.nome || !formData.email) return alert('Nome e E-mail são obrigatórios!')

    // --- TRAVA DE SEGURANÇA: E-MAIL ÚNICO ---
    const isEdicao = formData.id !== ''
    
    // Procura na tabela se já existe alguém com esse email (ignorando o próprio usuário se ele estiver se editando)
    const emailJaExiste = usuarios.some(
      (user) => user.email.toLowerCase() === formData.email.toLowerCase() && user.id !== formData.id
    )

    if (emailJaExiste) {
      return alert('Erro: Este e-mail já está cadastrado para outro usuário no sistema!')
    }
    // ----------------------------------------

    setSaving(true)

    // Se o formData tiver um ID, é edição. Se não tiver, criamos um ID novo.
    
    const dadosUsuario = {
      id: isEdicao ? formData.id : "USR-" + new Date().getTime(),
      nome: formData.nome,
      email: formData.email,
      perfil: formData.perfil,
      setor: formData.setor,
      telefone: formData.telefone,
      status: formData.status
    }

    try {
      if (isEdicao) {
        // Atualiza no Supabase e na Planilha
        await supabase.from('sys_usuarios').update(dadosUsuario).eq('id', dadosUsuario.id)
        await fetch(GOOGLE_WEBHOOK_URL, { method: 'POST', body: JSON.stringify({ acao: 'EDITAR_USUARIO', ...dadosUsuario }) })
      } else {
        // Cria no Supabase e na Planilha
        await supabase.from('sys_usuarios').insert([dadosUsuario])
        await fetch(GOOGLE_WEBHOOK_URL, { method: 'POST', body: JSON.stringify({ acao: 'NOVO_USUARIO', ...dadosUsuario }) })
      }

      setIsModalOpen(false)
      carregarUsuarios()
    } catch (err: any) {
      alert('Erro: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  function abrirModalEdicao(user: any) {
    setFormData(user) // Preenche o formulário com os dados da linha clicada
    setIsModalOpen(true)
  }

  async function alternarStatus(user: any) {
    const novoStatus = user.status === 'Ativo' ? 'Inativo' : 'Ativo'
    if (!confirm(`Tem certeza que deseja mudar o status para ${novoStatus}?`)) return
    
    // Atualiza apenas o status no Supabase e manda o usuário completo para o Google Sheets atualizar
    await supabase.from('sys_usuarios').update({ status: novoStatus }).eq('id', user.id)
    await fetch(GOOGLE_WEBHOOK_URL, { method: 'POST', body: JSON.stringify({ acao: 'EDITAR_USUARIO', ...user, status: novoStatus }) })
    carregarUsuarios()
  }
  // --- FIM DO NOVO BLOCO LÓGICO ---

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 relative">
      
      {/* MENU LATERAL */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl z-10">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white tracking-wide">SGI Hospitalar</h2>
          <p className="text-xs text-slate-400 mt-1">Portal de Gestão</p>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-2 text-sm font-medium">
          <a href="#" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <LayoutDashboard size={18} /> Início
          </a>
          <a href="#" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <FileText size={18} /> Contrato de Gestão
          </a>
          <div className="mt-4 mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider px-3">Configurações</div>
          <a href="/usuarios" className="flex items-center gap-3 p-3 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/20">
            <Users size={18} /> Usuários
          </a>
          <a href="#" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <Settings size={18} /> Permissões
          </a>
        </nav>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="bg-white p-6 border-b border-slate-200 flex justify-between items-center shadow-sm z-0">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-blue-600" /> Gestão de Usuários
          </h1>
          <div className="flex gap-3">
            <button onClick={carregarUsuarios} className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-medium transition-all">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Atualizar
            </button>
            {/* Botão que abre o Modal */}
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 shadow-md transition-all">
              <Plus size={18} /> Novo Usuário
            </button>
          </div>
        </header>

        {/* Conteúdo da Tabela */}
        <div className="p-8 flex-1 overflow-auto">
          {/* Tabela (Omitida pesquisa por brevidade) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  <th className="p-4">Nome</th>
                  <th className="p-4">E-mail</th>
                  <th className="p-4">Perfil</th>
                  <th className="p-4">Setor</th>
                  <th className="p-4">Telefone</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuarios.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-medium text-slate-800">{user.nome}</td>
                    <td className="p-4 text-slate-600">{user.email}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${user.perfil === 'Administrador' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {user.perfil}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">{user.setor}</td>
                    <td className="p-4 text-slate-600">{user.telefone}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${user.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-4 flex justify-center gap-2">
                      <button onClick={() => abrirModalEdicao(user)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors tooltip" title="Editar">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => alternarStatus(user)} className="p-1.5 text-orange-600 hover:bg-orange-100 rounded-md transition-colors" title={user.status === 'Ativo' ? 'Inativar' : 'Reativar'}>
                        <Ban size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL PREMIUM DE NOVO USUÁRIO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 transition-all">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            
            {/* Cabeçalho do Modal */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Plus size={20} className="text-blue-600" /> Cadastrar Novo Usuário
              </h3>
              <button onClick={() => { setIsModalOpen(false); setFormData({ id: '', nome: '', email: '', perfil: 'Usuário', setor: '', telefone: '', status: 'Ativo' }); }} className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-1 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Corpo do Modal (Formulário) */}
            <div className="p-6 flex flex-col gap-4 text-sm">
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-700">Nome Completo</label>
                <input type="text" className="p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 hover:bg-white" 
                  value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} placeholder="Ex: João da Silva" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-700">E-mail Corporativo</label>
                <input type="email" className="p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 hover:bg-white" 
                  value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="joao@hospital.com.br" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-700">Telefone</label>
                  <input type="text" className="p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-slate-50 hover:bg-white" 
                    value={formData.telefone} onChange={(e) => setFormData({...formData, telefone: e.target.value})} placeholder="(00) 00000-0000" />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-700">Perfil de Acesso</label>
                  <select className="p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-slate-50 hover:bg-white" 
                    value={formData.perfil} onChange={(e) => setFormData({...formData, perfil: e.target.value})}>
                    <option value="Usuário">Usuário (Padrão)</option>
                    <option value="Gestor">Gestor de Setor</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-700">Setor</label>
                <input type="text" className="p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-slate-50 hover:bg-white" 
                  value={formData.setor} onChange={(e) => setFormData({...formData, setor: e.target.value})} placeholder="Ex: Qualidade, UTI, Emergência" />
              </div>
            </div>

            {/* Rodapé do Modal (Botões) */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors">
                Cancelar
              </button>
              <button onClick={salvarUsuario} disabled={saving} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-md transition-colors disabled:bg-blue-400 flex items-center gap-2">
                {saving ? ( <><RefreshCw size={16} className="animate-spin" /> Salvando...</> ) : ( 'Salvar Usuário' )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
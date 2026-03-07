'use client'
import { useEffect, useState } from 'react'
import { Search, Plus, RefreshCw, Edit, Ban, LayoutDashboard, FileText, Users, Settings, X } from 'lucide-react'

export default function GestaoUsuarios() {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    id: '', nome: '', email: '', perfil: 'Usuário', setor: '', telefone: '', status: 'Ativo'
  })

  // SUA URL OFICIAL DO GOOGLE
  const GOOGLE_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwhJMeVeTUxHX_X6mJTfgDGrtYvoXbIb2YNDuC7Phlum_tsWfjcCPXp4lY5wNcW5e4/exec'

  // --- NOVA FUNÇÃO QUE BUSCA DA PLANILHA ---
  async function carregarUsuarios() {
    setLoading(true)
    try {
      // Faz um GET na URL do Google pedindo a lista
      const resposta = await fetch(`${GOOGLE_WEBHOOK_URL}?acao=LISTAR_USUARIOS`);
      const dados = await resposta.json();
      setUsuarios(dados);
    } catch (erro) {
      console.error(erro);
      alert("Erro ao puxar a lista da planilha.");
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarUsuarios()
  }, [])

  // --- FUNÇÃO DE SALVAR ATUALIZADA ---
  async function salvarUsuario() {
    if (!formData.nome || !formData.email) return alert('Nome e E-mail são obrigatórios!')

    const isEdicao = formData.id !== ''
    const emailJaExiste = usuarios.some((user) => user.email.toLowerCase() === formData.email.toLowerCase() && user.id !== formData.id)
    if (emailJaExiste) return alert('Erro: Este e-mail já está cadastrado para outro usuário no sistema!')

    setSaving(true)

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
      // Uso de text/plain evita bloqueio de CORS do navegador
      const payload = { acao: isEdicao ? 'EDITAR_USUARIO' : 'NOVO_USUARIO', ...dadosUsuario };
      
      await fetch(GOOGLE_WEBHOOK_URL, { 
        method: 'POST', 
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, 
        body: JSON.stringify(payload) 
      })

      setIsModalOpen(false)
      alert(isEdicao ? 'Usuário atualizado com sucesso!' : 'Usuário cadastrado com sucesso!')
      carregarUsuarios() // Recarrega a tabela imediatamente
    } catch (err: any) {
      alert('Erro ao enviar para o servidor: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  function abrirModalEdicao(user: any) {
    setFormData(user) 
    setIsModalOpen(true)
  }

  async function alternarStatus(user: any) {
    const novoStatus = user.status === 'Ativo' ? 'Inativo' : 'Ativo'
    if (!confirm(`Tem certeza que deseja mudar o status para ${novoStatus}?`)) return
    
    try {
      const payload = { acao: 'EDITAR_USUARIO', ...user, status: novoStatus };
      await fetch(GOOGLE_WEBHOOK_URL, { 
        method: 'POST', 
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, 
        body: JSON.stringify(payload) 
      })
      alert(`Status alterado para ${novoStatus}!`)
      carregarUsuarios()
    } catch (err) {
      alert('Erro ao atualizar status no servidor.')
    }
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 relative">
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="bg-white p-6 border-b border-slate-200 flex justify-between items-center shadow-sm z-0">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-blue-600" /> Gestão de Usuários
          </h1>
          <div className="flex gap-3">
            <button onClick={carregarUsuarios} className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-medium transition-all">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Atualizar
            </button>
            <button onClick={() => { setFormData({ id: '', nome: '', email: '', perfil: 'Usuário', setor: '', telefone: '', status: 'Ativo' }); setIsModalOpen(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 shadow-md transition-all">
              <Plus size={18} /> Novo Usuário
            </button>
          </div>
        </header>

        <div className="p-8 flex-1 overflow-auto">
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
                {loading ? (
                   <tr><td colSpan={7} className="p-8 text-center text-slate-500">Buscando na planilha...</td></tr>
                ) : usuarios.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-slate-500">Nenhum usuário cadastrado na planilha ainda.</td></tr>
                ) : (
                  usuarios.map((user) => (
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 transition-all">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Plus size={20} className="text-blue-600" /> {formData.id ? 'Editar Usuário' : 'Cadastrar Novo Usuário'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-1 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6 flex flex-col gap-4 text-sm">
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-700">Nome Completo</label>
                <input type="text" className="p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 hover:bg-white" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-700">E-mail Corporativo</label>
                <input type="email" className="p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 hover:bg-white" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-700">Telefone</label>
                  <input type="text" className="p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 hover:bg-white" value={formData.telefone} onChange={(e) => setFormData({...formData, telefone: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-700">Perfil de Acesso</label>
                  <select className="p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 hover:bg-white" value={formData.perfil} onChange={(e) => setFormData({...formData, perfil: e.target.value})}>
                    <option value="Usuário">Usuário (Padrão)</option><option value="Gestor">Gestor de Setor</option><option value="Administrador">Administrador</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-700">Setor</label>
                <input type="text" className="p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 hover:bg-white" value={formData.setor} onChange={(e) => setFormData({...formData, setor: e.target.value})} />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-200 rounded-lg">Cancelar</button>
              <button onClick={salvarUsuario} disabled={saving} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2">
                {saving ? <><RefreshCw size={16} className="animate-spin" /> Salvando...</> : 'Salvar Usuário'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
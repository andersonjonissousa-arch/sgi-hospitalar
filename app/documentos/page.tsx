'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  FolderOpen, 
  Filter, 
  ExternalLink, 
  Calendar, 
  Mail, 
  Info, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  X,
  FileText,
  Edit,
  Trash2
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Utility for Tailwind class merging */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Supabase Configuration ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// URL do seu Google Apps Script (Webhook)
const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwhJMeVeTUxHX_X6mJTfgDGrtYvoXbIb2YNDuC7Phlum_tsWfjcCPXp4lY5wNcW5e4/exec'; // ⚠️ Cole sua URL do Google Apps Script aqui!

// --- Types ---
interface Documento {
  id?: string;
  nome: string;
  codigo: string;
  link: string;
  tipo: string;
  localizacao: string;
  status: string;
  versao: string;
  revisao: string;
  dataRevisao: string;
  proximaRevisao: string;
  emailAnderson: string;
  emailAmanda: string;
  dataCobranca: string;
  respCobranca: string;
  observacoes: string;
}

export default function GestaoDocumentalPage() {
  // --- States ---
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterLocalizacao, setFilterLocalizacao] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterVencimento, setFilterVencimento] = useState('');

  // Form State
  const [formData, setFormData] = useState<Documento>({
    id: '',
    nome: '', codigo: '', link: '', tipo: 'Política', localizacao: 'Institucional',
    status: 'Publicado e divulgado', versao: '', revisao: '', dataRevisao: '',
    proximaRevisao: '', emailAnderson: '', emailAmanda: '', dataCobranca: '',
    respCobranca: '', observacoes: ''
  });

  // --- Fetch Data ---
  const fetchDocumentos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('gestao_documental').select('*');

      if (error) throw error;

      const documentosFormatados = (data || []).map((row: any) => ({
        id: row.id,
        nome: row.nome_documento || '',
        codigo: row.codigo || '',
        link: row.link_documento || '',
        tipo: row.tipo_documento || '-',
        localizacao: row.localizacao_documento || '-',
        status: row.status || '-',
        versao: row.versao || '',
        revisao: row.revisao || '',
        dataRevisao: row.data_revisao || '',
        proximaRevisao: row.proxima_revisao || '',
        emailAnderson: row.email_anderson || '',
        emailAmanda: row.email_amanda || '',
        dataCobranca: row.data_ultima_cobranca || '',
        respCobranca: row.responsavel_ultima_cobranca || '',
        observacoes: row.observacoes || ''
      }));

      setDocumentos(documentosFormatados);
    } catch (err) {
      console.error('Erro ao buscar documentos:', err);
      setDocumentos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentos();
  }, []);

  // --- Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const abrirModalNovo = () => {
    setFormData({
      id: '', nome: '', codigo: '', link: '', tipo: 'Política', localizacao: 'Institucional',
      status: 'Publicado e divulgado', versao: '', revisao: '', dataRevisao: '',
      proximaRevisao: '', emailAnderson: '', emailAmanda: '', dataCobranca: '',
      respCobranca: '', observacoes: ''
    });
    setIsModalOpen(true);
  };

  const abrirModalEdicao = (doc: Documento) => {
    setFormData(doc);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string | undefined, nome: string) => {
    if (!id) return;
    if (!confirm(`⚠️ ATENÇÃO: Tem certeza que deseja excluir o documento "${nome}"?`)) return;

    try {
      // 1. Exclui do Supabase
      const { error } = await supabase.from('gestao_documental').delete().eq('id', id);
      if (error) throw error;

      // 2. Avisa o Webhook para apagar na Planilha (Se o seu Apps Script tiver a ação EXCLUIR_DOCUMENTO)
      try {
        await fetch(WEBHOOK_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ acao: 'EXCLUIR_DOCUMENTO', id: id })
        });
      } catch (webhookErr) {
        console.warn('Aviso Webhook Exclusão:', webhookErr);
      }

      fetchDocumentos();
      alert('Documento excluído com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir documento.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const isEdicao = formData.id !== '';

    try {
      const dadosParaBanco = {
        id: isEdicao ? formData.id : "DOC-" + new Date().getTime(),
        nome_documento: formData.nome,
        codigo: formData.codigo,
        link_documento: formData.link,
        tipo_documento: formData.tipo,
        localizacao_documento: formData.localizacao,
        status: formData.status,
        versao: formData.versao,
        revisao: formData.revisao,
        data_revisao: formData.dataRevisao,
        proxima_revisao: formData.proximaRevisao,
        email_anderson: formData.emailAnderson,
        email_amanda: formData.emailAmanda,
        data_ultima_cobranca: formData.dataCobranca,
        responsavel_ultima_cobranca: formData.respCobranca,
        observacoes: formData.observacoes
      };

      if (isEdicao) {
        // ATUALIZA NO BANCO
        const { error } = await supabase.from('gestao_documental').update(dadosParaBanco).eq('id', formData.id);
        if (error) throw error;
        
        // AVISA A PLANILHA DA EDIÇÃO
        try {
          await fetch(WEBHOOK_URL, {
            method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ acao: 'EDITAR_DOCUMENTO', ...dadosParaBanco })
          });
        } catch (e) {}
        alert('Documento atualizado com sucesso!');

      } else {
        // INSERE NO BANCO
        const { error } = await supabase.from('gestao_documental').insert([dadosParaBanco]);
        if (error) throw error;

        // AVISA A PLANILHA DO NOVO DOCUMENTO
        try {
          await fetch(WEBHOOK_URL, {
            method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ acao: 'NOVO_DOCUMENTO', ...dadosParaBanco })
          });
        } catch (e) {}
        alert('Documento criado com sucesso!');
      }

      setIsModalOpen(false);
      fetchDocumentos();
    } catch (err) {
      console.error('Erro ao salvar documento:', err);
      alert('Erro ao salvar no banco de dados. Verifique a conexão.');
    } finally {
      setIsSaving(false);
    }
  };

  // --- Filter Logic ---
  const filteredDocumentos = useMemo(() => {
    return documentos.filter(doc => {
      const matchSearch = doc.nome.toLowerCase().includes(search.toLowerCase()) || 
                          doc.codigo.toLowerCase().includes(search.toLowerCase());
      const matchTipo = filterTipo ? doc.tipo === filterTipo : true;
      const matchLocal = filterLocalizacao ? doc.localizacao === filterLocalizacao : true;
      const matchStatus = filterStatus ? doc.status === filterStatus : true;
      
      let matchVencimento = true;
      if (filterVencimento) {
        const hoje = new Date();
        const dataProx = new Date(doc.proximaRevisao);
        if (filterVencimento === 'validade') matchVencimento = dataProx >= hoje;
        if (filterVencimento === 'vencidos') matchVencimento = dataProx < hoje;
      }

      return matchSearch && matchTipo && matchLocal && matchStatus && matchVencimento;
    });
  }, [documentos, search, filterTipo, filterLocalizacao, filterStatus, filterVencimento]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 text-slate-900 font-sans">
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <FolderOpen className="text-amber-500 w-8 h-8" />
            Gestão Documental
          </h1>
          <p className="text-slate-500 mt-1">Controle e organização de documentos hospitalares</p>
        </div>
        <button 
          onClick={abrirModalNovo}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 font-semibold"
        >
          <Plus size={20} />
          Novo Documento
        </button>
      </div>

      <div className="max-w-7xl mx-auto bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar documento..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <select className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)}>
            <option value="">Todos os Tipos</option>
            <option value="Política">Política</option>
            <option value="Normatização">Normatização</option>
            <option value="Fluxograma">Fluxograma</option>
            <option value="Formulário">Formulário</option>
            <option value="Manual">Manual</option>
          </select>

          <select className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" value={filterLocalizacao} onChange={(e) => setFilterLocalizacao(e.target.value)}>
            <option value="">Todas as Localizações</option>
            <option value="Institucional">Institucional</option>
            <option value="UTI">UTI</option>
            <option value="Emergência">Emergência</option>
          </select>

          <select className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Todos os Status</option>
            <option value="Publicado e divulgado">Publicado e divulgado</option>
            <option value="Em análise">Em análise</option>
            <option value="Obsoleto">Obsoleto</option>
          </select>

          <select className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" value={filterVencimento} onChange={(e) => setFilterVencimento(e.target.value)}>
            <option value="">Todos os Prazos</option>
            <option value="validade">Em Validade (No prazo)</option>
            <option value="vencidos">Vencidos (Atrasados)</option>
          </select>
        </div>
      </div>

      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-bottom border-slate-100">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Código / Nome</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Localização</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Próxima Revisão</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      Carregando documentos...
                    </div>
                  </td>
                </tr>
              ) : filteredDocumentos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                    Nenhum documento encontrado.
                  </td>
                </tr>
              ) : (
                filteredDocumentos.map((doc, idx) => {
                  let isVencido = false;
                  let dataBr = '-';
                  if (doc.proximaRevisao && doc.proximaRevisao !== '-') {
                    const dataFormatada = new Date(doc.proximaRevisao);
                    if (!isNaN(dataFormatada.getTime())) {
                      isVencido = dataFormatada < new Date();
                      dataBr = dataFormatada.toLocaleDateString('pt-BR');
                    } else {
                      dataBr = doc.proximaRevisao;
                    }
                  }

                  return (
                    <tr key={`doc-${doc.id || idx}-${doc.codigo}`} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-mono text-slate-400">{doc.codigo}</span>
                          <span className="font-medium text-slate-700">{doc.nome}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          {doc.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{doc.localizacao}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
                          doc.status === 'Publicado e divulgado' ? "bg-emerald-50 text-emerald-700" :
                          doc.status === 'Em análise' ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
                        )}>
                          {doc.status === 'Publicado e divulgado' ? <CheckCircle size={12} /> : 
                           doc.status === 'Em análise' ? <Clock size={12} /> : <AlertCircle size={12} />}
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className={cn(
                          "flex items-center gap-2 text-sm",
                          isVencido ? "text-rose-600 font-semibold" : "text-slate-600"
                        )}>
                          <Calendar size={14} />
                          {dataBr}
                          {isVencido && <AlertCircle size={14} />}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {doc.link && doc.link !== '-' ? (
                          <a 
                            href={doc.link.startsWith('http') ? doc.link : `https://${doc.link}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Abrir PDF"
                          >
                            <ExternalLink size={18} />
                          </a>
                        ) : (
                          <span className="text-slate-300 inline-flex p-2"><ExternalLink size={18} /></span>
                        )}
                        <button 
                          onClick={() => abrirModalEdicao(doc)}
                          className="inline-flex items-center justify-center p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors ml-1"
                          title="Editar"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(doc.id, doc.nome)}
                          className="inline-flex items-center justify-center p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors ml-1"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal SPA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => !isSaving && setIsModalOpen(false)} />
          
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 py-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  {formData.id ? 'Editar Documento' : 'Novo Documento'}
                </h2>
                <p className="text-slate-500 text-sm">Preencha os dados para registrar no sistema</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {/* Seção: Informações Básicas */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-2">
                  <Info size={16} /> Informações Básicas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Documento</label>
                    <input required name="nome" value={formData.nome} onChange={handleInputChange} type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Código</label>
                    <input required name="codigo" value={formData.codigo} onChange={handleInputChange} type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Link do Documento (URL)</label>
                    <input required name="link" value={formData.link} onChange={handleInputChange} type="url" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              </div>

              {/* Seção: Classificação */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-2">
                  <Filter size={16} /> Classificação e Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                    <select name="tipo" value={formData.tipo} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="Política">Política</option>
                      <option value="Normatização">Normatização</option>
                      <option value="Fluxograma">Fluxograma</option>
                      <option value="Formulário">Formulário</option>
                      <option value="Manual">Manual</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Localização</label>
                    <select name="localizacao" value={formData.localizacao} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="Institucional">Institucional</option>
                      <option value="UTI">UTI</option>
                      <option value="Emergência">Emergência</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="Publicado e divulgado">Publicado e divulgado</option>
                      <option value="Em análise">Em análise</option>
                      <option value="Obsoleto">Obsoleto</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Seção: Controle de Revisão */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-2">
                  <Clock size={16} /> Controle de Revisão
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Versão</label>
                    <input name="versao" value={formData.versao} onChange={handleInputChange} type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Revisão</label>
                    <input name="revisao" value={formData.revisao} onChange={handleInputChange} type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Data Revisão</label>
                    <input name="dataRevisao" value={formData.dataRevisao} onChange={handleInputChange} type="date" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Próxima Revisão</label>
                    <input name="proximaRevisao" value={formData.proximaRevisao} onChange={handleInputChange} type="date" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              </div>

              {/* Seção: Cobrança e Equipe */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-2">
                  <Mail size={16} /> Cobrança e Equipe
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">E-mail - Anderson</label>
                    <input name="emailAnderson" value={formData.emailAnderson} onChange={handleInputChange} type="email" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">E-mail - Amanda</label>
                    <input name="emailAmanda" value={formData.emailAmanda} onChange={handleInputChange} type="email" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Última Cobrança</label>
                    <input name="dataCobranca" value={formData.dataCobranca} onChange={handleInputChange} type="date" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Resp. Cobrança</label>
                    <input name="respCobranca" value={formData.respCobranca} onChange={handleInputChange} type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
                <textarea name="observacoes" value={formData.observacoes} onChange={handleInputChange} rows={4} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
              </div>

              {/* Footer Modal */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSaving} className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors font-medium">
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-2.5 rounded-xl shadow-lg shadow-blue-200 transition-all font-semibold flex items-center gap-2">
                  {isSaving ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Salvando...</>
                  ) : (
                    <><FileText size={18} />{formData.id ? 'Salvar Alterações' : 'Salvar Documento'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
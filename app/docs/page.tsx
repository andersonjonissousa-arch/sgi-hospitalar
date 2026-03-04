'use client';
import Script from 'next/script';
// ADICIONADO useEffect AQUI
import { useState, useEffect } from 'react';
import { Upload, HardDrive, Plus, X, FileText, ExternalLink, Loader2 } from 'lucide-react';

export default function DocumentosPage() {
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docs, setDocs] = useState<any[]>([]); // Para os Cards
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('Todos');
  const [form, setForm] = useState({ tipo: 'Censo Hospitalar', competencia: '' });

  // 1. useEffect PARA CARREGAR AS BIBLIOTECAS DO GOOGLE
  useEffect(() => {
    const carregarGapi = () => {
      // @ts-ignore
      if (typeof gapi !== 'undefined') {
        // @ts-ignore
        gapi.load('picker', () => console.log("Google Picker pronto"));
      }
    };
    const timer = setTimeout(carregarGapi, 2000); // Aguarda 2 segundos para garantir o carregamento
    return () => clearTimeout(timer);
  }, []);

  // 2. useEffect PARA BUSCAR OS DOCUMENTOS DA PLANILHA (CARDS)
  useEffect(() => {
    // @ts-ignore
    if (typeof google !== 'undefined' && google.script) {
      // @ts-ignore
      google.script.run
        .withSuccessHandler((data: any) => {
          setDocs(data);
          setLoading(false);
        })
        .getListaDocumentosGeral();
    } else {
      // Simulação para quando estiver no VS Code Local
      setLoading(false);
    }
  }, []);

  const executarScript = (funcaoNome: string, parametros: any, callbackSucesso: Function) => {
    // @ts-ignore
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      // @ts-ignore
      google.script.run
        .withSuccessHandler(callbackSucesso)
        .withFailureHandler((err: any) => alert("Erro no servidor: " + err))
        [funcaoNome](parametros);
    } else {
      console.warn(`Ambiente Local: A função "${funcaoNome}" seria chamada.`);
      alert("Integração disponível apenas na versão publicada (Google Script).");
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result;
      executarScript('uploadArquivoComputador', {
        arquivoBase64: base64,
        nomeArquivo: file.name,
        tipoArquivo: file.type,
        tipo: form.tipo,
        competencia: form.competencia
      }, () => {
        setUploading(false);
        setShowModal(false);
        alert("Documento salvo com sucesso!");
        window.location.reload(); // Recarrega para mostrar o novo card
      });
    };
  };

  const abrirPicker = () => {
    // @ts-ignore
    if (typeof gapi === 'undefined' || typeof google === 'undefined') {
      alert("Aguarde... as bibliotecas do Google ainda estão carregando.");
      return;
    }

    executarScript('getPickerToken', {}, (token: string) => {
      // @ts-ignore
      gapi.load('picker', {
        callback: () => {
          // @ts-ignore
          const view = new google.picker.DocsView(google.picker.ViewId.DOCS);
          view.setMimeFilters('application/pdf,application/vnd.google-apps.spreadsheet');
          // @ts-ignore
          const picker = new google.picker.PickerBuilder()
            .addView(view)
            .setOAuthToken(token)
            .setCallback((data: any) => {
              // @ts-ignore
              if (data.action === google.picker.Action.PICKED) {
                // @ts-ignore
                const doc = data.docs[0];
                executarScript('vincularArquivoDrive', {
                  fileId: doc.id,
                  tipo: form.tipo,
                  competencia: form.competencia
                }, () => {
                  alert("Arquivo vinculado!");
                  setShowModal(false);
                  window.location.reload();
                });
              }
            })
            .build();
          picker.setVisible(true);
        }
      });
    });
  };

  return (
    <>
      <Script src="https://apis.google.com/js/api.js" strategy="afterInteractive" />
      
      <div className="p-8 bg-slate-50 min-h-screen">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Documentação Estratégica</h1>
            <p className="text-slate-500">Gestão centralizada de arquivos</p>
          </div>
          
          <button 
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
          >
            <Plus size={20} /> Novo Documento
          </button>
        </div>

        {/* BARRA DE FILTROS */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          {['Todos', 'Censo Hospitalar', 'Contratos de Gestão', 'Relatórios do Contrato'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFiltro(cat)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                filtro === cat ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-600 border hover:border-blue-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* GRADE DE DOCUMENTOS EM CARDS */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {docs.filter(d => filtro === 'Todos' || d.tipo === filtro).map((doc) => (
              <div key={doc.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <FileText size={24} />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 rounded text-slate-500 uppercase">
                    {doc.competencia}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 truncate mb-1">{doc.nome}</h3>
                <p className="text-xs text-slate-400 mb-4">{doc.tipo}</p>
                <a href={doc.link} target="_blank" className="flex items-center justify-center gap-2 w-full py-2 bg-slate-50 hover:bg-blue-50 text-blue-600 rounded-lg text-sm font-semibold transition-colors">
                  Visualizar <ExternalLink size={14} />
                </a>
              </div>
            ))}
          </div>
        )}

        {/* MODAL DE UPLOAD */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                <h2 className="font-bold text-xl text-slate-800">Adicionar Arquivo</h2>
                <button onClick={() => setShowModal(false)}><X /></button>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Categoria</label>
                  <select 
                    className="w-full p-3 rounded-xl border border-slate-200"
                    onChange={(e) => setForm({...form, tipo: e.target.value})}
                  >
                    <option>Censo Hospitalar</option>
                    <option>Contratos de Gestão</option>
                    <option>Relatórios do Contrato</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Competência (MM/AAAA)</label>
                  <input type="text" placeholder="ex: 03/2026" className="w-full p-3 rounded-xl border border-slate-200" onChange={(e) => setForm({...form, competencia: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all">
                    <Upload className="text-blue-600 mb-2" />
                    <span className="text-xs font-bold text-slate-600 text-center">Do Computador</span>
                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                  </label>
                  <button onClick={abrirPicker} className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all">
                    <HardDrive className="text-blue-600 mb-2" />
                    <span className="text-xs font-bold text-slate-600 text-center">Do Google Drive</span>
                  </button>
                </div>
                {uploading && <p className="text-center text-blue-600 font-bold animate-pulse">Enviando...</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  Download,
  Trash2,
  Sparkles,
  RefreshCw,
  Edit3,
  List,
  Layers,
  FileCheck,
  Check,
  X,
  AlertTriangle
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Contract } from '../types/contractTypes';

export const ContractDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Outline/TOC filtering
  const [outlineSearch, setOutlineSearch] = useState('');

  // Editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [editedCategory, setEditedCategory] = useState('');

  // Reader ref for scrolling
  const readerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id || !currentUser) return;

    // Real-time listener for the specific contract doc
    const docRef = doc(db, 'contracts', id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Contract;
        setContract(data);
        setEditedName(data.contractName);
        setEditedCategory(data.contractCategory);
      } else {
        showToast('Document not found in database.', 'error');
        navigate('/contracts');
      }
      setLoading(false);
    }, (err) => {
      console.error('Error loading contract details:', err);
      showToast('Error syncing contract workspace.', 'error');
      setLoading(false);
    });

    return unsubscribe;
  }, [id, currentUser, navigate, showToast]);

  const handleRename = async () => {
    if (!id || !editedName.trim()) return;
    try {
      const docRef = doc(db, 'contracts', id);
      await updateDoc(docRef, { contractName: editedName.trim() });
      showToast('Contract title updated successfully.', 'success');
      setIsEditingName(false);
    } catch (err) {
      showToast('Failed to update contract name.', 'error');
    }
  };

  const handleCategoryChange = async (cat: string) => {
    if (!id) return;
    try {
      const docRef = doc(db, 'contracts', id);
      await updateDoc(docRef, { contractCategory: cat });
      showToast('Category updated.', 'success');
      setIsEditingCategory(false);
    } catch (err) {
      showToast('Failed to update category.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!id || !currentUser) return;
    setIsDeleting(true);
    try {
      const idToken = await currentUser.getIdToken();
      const response = await fetch(`http://localhost:5001/api/contracts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Server repository deletion failure.');
      }

      showToast('Document successfully purged.', 'success');
      navigate('/contracts');
    } catch (err: any) {
      showToast(err.message || 'Purge failed.', 'error');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleReparse = async () => {
    if (!id || !currentUser) return;
    setLoading(true);
    try {
      const idToken = await currentUser.getIdToken();
      const response = await fetch('http://localhost:5001/api/contracts/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ contractId: id })
      });

      if (!response.ok) {
        throw new Error('Reparsing endpoint failed.');
      }
      showToast('Parsing successfully re-triggered.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Parsing failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Apply a temporary highlight effect
      element.classList.add('bg-white/5');
      setTimeout(() => {
        element.classList.remove('bg-white/5');
      }, 1500);
    }
  };



  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Render Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-slate-100 flex flex-col items-center justify-center">
        <RefreshCw className="animate-spin text-primary h-10 w-10 mb-4" />
        <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Loading Workspace Details...</p>
      </div>
    );
  }

  // Fallback if contract is missing
  if (!contract) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-slate-100 flex flex-col items-center justify-center p-4">
        <FileText size={48} className="text-slate-600 mb-3" />
        <p className="text-xs text-slate-400 font-semibold">Document not found.</p>
        <Link to="/contracts" className="mt-4 text-xs font-bold text-primary hover:underline">Return to Vault</Link>
      </div>
    );
  }

  // Render Ingestion/Processing States
  if (contract.status === 'processing') {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="relative h-20 w-20 flex items-center justify-center mb-6">
          <div className="absolute inset-0 rounded-full border border-primary/20 border-t-primary animate-spin" />
          <div className="absolute h-4/5 w-4/5 rounded-full border border-cyan-500/10 border-b-cyan-500 animate-spin [animation-duration:1.5s]" />
          <Layers size={24} className="text-cyan-400 animate-pulse" />
        </div>
        <h3 className="font-heading font-extrabold text-sm uppercase tracking-widest text-slate-200">Processing Layout Structure</h3>
        <p className="text-3xs text-slate-500 font-semibold uppercase mt-1 animate-pulse">Running PDF/DOCX Parsing Engine...</p>
      </div>
    );
  }

  const sectionsList = contract.structuredText || [];
  const outlineItems = sectionsList.filter(sec => 
    sec.title.toLowerCase().includes(outlineSearch.toLowerCase()) || 
    (sec.sectionNumber && sec.sectionNumber.includes(outlineSearch))
  );

  return (
    <PageContainer
      title="Contract Workspace"
      subtitle={`vault id: ${contract.contractId}`}
      action={
        <div className="flex gap-2">
          <Link 
            to="/contracts" 
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-2xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft size={12} />
            <span>Vault Directory</span>
          </Link>

          <a 
            href={contract.storageUrl}
            download={contract.fileName}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-secondary px-3.5 py-2 text-2xs font-semibold text-white hover:opacity-95 shadow-md shadow-primary/10 transition-all"
          >
            <Download size={12} />
            <span>Download Original</span>
          </a>
        </div>
      }
    >
      
      {/* Top Banner Page Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 text-left">
        
        {/* Left Pane: Document Outline / Table of Contents (3 cols) */}
        <div className="lg:col-span-3 flex flex-col space-y-4">
          <div className="rounded-2xl border border-white/5 bg-[#111827]/20 p-4 backdrop-blur-md flex flex-col h-[calc(100vh-180px)] glass-panel">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <List size={14} className="text-cyan-400" />
              <h4 className="font-heading font-extrabold text-[10px] uppercase tracking-wider text-slate-200">Document Outline</h4>
            </div>

            {/* Outline search */}
            <div className="relative mt-3 mb-3 shrink-0">
              <input 
                type="text" 
                placeholder="Search sections..."
                value={outlineSearch}
                onChange={(e) => setOutlineSearch(e.target.value)}
                className="w-full rounded-lg border border-white/5 bg-black/30 py-1.5 px-3 text-[10px] text-slate-300 placeholder-slate-600 outline-none focus:border-primary"
              />
            </div>

            {/* Scrolling Outline List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 font-medium">
              {outlineItems.length === 0 ? (
                <p className="text-3xs text-slate-600 text-center py-4">No sections match query.</p>
              ) : (
                outlineItems.map((sec) => {
                  return (
                    <div 
                      key={sec.id}
                      style={{ paddingLeft: `${(sec.level - 1) * 8}px` }}
                      className="group"
                    >
                      <div 
                        onClick={() => scrollToSection(sec.id)}
                        className={`flex items-start gap-1.5 rounded-lg px-2.5 py-1.5 text-3xs transition-all duration-150 cursor-pointer ${
                          sec.level === 1 
                            ? 'text-slate-200 font-bold hover:bg-white/5' 
                            : 'text-slate-400 hover:bg-white/3 hover:text-white'
                        }`}
                      >
                        <FileText size={10} className="shrink-0 mt-0.5 text-slate-500 group-hover:text-cyan-400" />
                        <span className="truncate flex-1">
                          {sec.sectionNumber && `${sec.sectionNumber} `}{sec.title}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Center Pane: Real Document Viewport (6 cols) */}
        <div className="lg:col-span-6 flex flex-col space-y-4">
          <div className="rounded-2xl border border-white/5 bg-[#111827]/15 p-6 backdrop-blur-md flex flex-col h-[calc(100vh-180px)] glass-panel">
            
            <div className="flex items-center justify-between border-b border-white/5 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <FileCheck size={16} className="text-primary" />
                {isEditingName ? (
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="text" 
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="rounded-lg border border-primary bg-black/40 py-1 px-2 text-xs text-white outline-none w-56 font-bold"
                    />
                    <button onClick={handleRename} className="p-1 rounded bg-green-500/10 hover:bg-green-500/20 text-green-400 cursor-pointer">
                      <Check size={12} />
                    </button>
                    <button onClick={() => setIsEditingName(false)} className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer">
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider text-slate-100 max-w-[280px] truncate">
                      {contract.contractName}
                    </h3>
                    <button 
                      onClick={() => setIsEditingName(true)}
                      className="p-1 text-slate-500 hover:text-white transition-colors cursor-pointer"
                    >
                      <Edit3 size={11} />
                    </button>
                  </div>
                )}
              </div>
              
              <span className="text-[10px] text-slate-500 font-mono">
                {contract.fileType.split('/').pop()?.toUpperCase() || 'DOCUMENT'}
              </span>
            </div>

            {/* Document Reader Container */}
            <div 
              ref={readerContainerRef}
              className="flex-1 overflow-y-auto mt-4 pr-3 space-y-6 scroll-smooth h-full text-xs text-slate-300 leading-relaxed border-t border-white/5 pt-4"
            >
              {sectionsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                  <AlertTriangle className="text-amber-500 h-8 w-8" />
                  <p className="text-2xs text-slate-400">Layout structure is empty.</p>
                  <button onClick={handleReparse} className="rounded-lg bg-primary/20 hover:bg-primary/30 text-primary text-3xs font-semibold px-3 py-1.5 transition-colors">
                    Re-Trigger Parse
                  </button>
                </div>
              ) : (
                sectionsList.map((sec) => (
                  <div 
                    id={`section-${sec.id}`} 
                    key={sec.id} 
                    className="group scroll-mt-6 p-2 rounded-xl transition-colors duration-300"
                  >
                    <h4 className={`font-heading font-bold tracking-tight select-none mb-1.5 ${
                      sec.level === 1 ? 'text-xs text-primary font-extrabold border-b border-white/5 pb-1 mt-2' :
                      sec.level === 2 ? 'text-[11px] text-cyan-400 font-semibold' : 'text-3xs text-slate-400'
                    }`}>
                      {sec.sectionNumber && `${sec.sectionNumber} `}{sec.title}
                    </h4>
                    <p className="pl-3 border-l border-white/5 text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                      {sec.content}
                    </p>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>

        {/* Right Pane: Metadata Properties & Stats (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Section: Properties Metadata */}
          <div className="rounded-2xl border border-white/5 bg-[#111827]/20 p-4 backdrop-blur-md space-y-4 glass-panel">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <Sparkles size={14} className="text-primary" />
              <h4 className="font-heading font-extrabold text-[10px] uppercase tracking-wider text-slate-200">Extracted Metadata</h4>
            </div>

            <div className="space-y-3.5 text-2xs">
              
              {/* Category */}
              <div className="space-y-1">
                <span className="block text-3xs font-extrabold uppercase text-slate-500 tracking-wider">Category</span>
                {isEditingCategory ? (
                  <select 
                    value={editedCategory} 
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full rounded-lg border border-primary bg-[#111827] py-1.5 px-2.5 text-3xs text-slate-200 outline-none"
                    autoFocus
                    onBlur={() => setIsEditingCategory(false)}
                  >
                    {['NDA', 'Employment', 'Vendor', 'Partnership', 'SaaS', 'DPA', 'Other'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 text-3xs font-bold uppercase text-cyan-400">
                      {contract.contractCategory}
                    </span>
                    <button 
                      onClick={() => setIsEditingCategory(true)}
                      className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                    >
                      <Edit3 size={10} />
                    </button>
                  </div>
                )}
              </div>

              {/* Parties */}
              <div className="space-y-1">
                <span className="block text-3xs font-extrabold uppercase text-slate-500 tracking-wider">Identified Parties</span>
                {contract.parties.length === 0 ? (
                  <span className="text-slate-500 italic">None detected</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {contract.parties.map((party, index) => (
                      <span key={index} className="rounded bg-white/5 border border-white/5 px-2 py-0.5 text-[10px] text-slate-300 font-semibold truncate max-w-full">
                        {party}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Effective Date */}
              <div className="space-y-1">
                <span className="block text-3xs font-extrabold uppercase text-slate-500 tracking-wider">Effective Date</span>
                <span className="font-mono text-slate-300 font-bold block bg-black/10 border border-white/3 rounded-lg p-2">
                  {contract.effectiveDate || 'Not Detected'}
                </span>
              </div>

              {/* Expiration Date */}
              <div className="space-y-1">
                <span className="block text-3xs font-extrabold uppercase text-slate-500 tracking-wider">Expiration Date</span>
                <span className="font-mono text-slate-300 font-bold block bg-black/10 border border-white/3 rounded-lg p-2">
                  {contract.expirationDate || 'Not Detected'}
                </span>
              </div>

            </div>
          </div>

          {/* Section: Document Statistics */}
          <div className="rounded-2xl border border-white/5 bg-[#111827]/20 p-4 backdrop-blur-md space-y-4 glass-panel">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <Layers size={14} className="text-slate-400" />
              <h4 className="font-heading font-extrabold text-[10px] uppercase tracking-wider text-slate-200">Document Metrics</h4>
            </div>

            <div className="grid grid-cols-2 gap-3 text-2xs text-left">
              <div className="rounded-xl bg-black/10 border border-white/3 p-3">
                <span className="block text-3xs text-slate-500 uppercase font-bold">Page Count</span>
                <span className="mt-1 block text-sm font-extrabold text-slate-200 font-mono">
                  {contract.pageCount}
                </span>
              </div>
              <div className="rounded-xl bg-black/10 border border-white/3 p-3">
                <span className="block text-3xs text-slate-500 uppercase font-bold">Word Count</span>
                <span className="mt-1 block text-sm font-extrabold text-slate-200 font-mono">
                  {contract.wordCount.toLocaleString()}
                </span>
              </div>
              <div className="rounded-xl bg-black/10 border border-white/3 p-3">
                <span className="block text-3xs text-slate-500 uppercase font-bold">Section Nodes</span>
                <span className="mt-1 block text-sm font-extrabold text-slate-200 font-mono">
                  {sectionsList.length}
                </span>
              </div>
              <div className="rounded-xl bg-black/10 border border-white/3 p-3">
                <span className="block text-3xs text-slate-500 uppercase font-bold">File Size</span>
                <span className="mt-1 block text-sm font-extrabold text-slate-200 font-mono">
                  {formatBytes(contract.fileSize)}
                </span>
              </div>
            </div>

            <div className="border-t border-white/5 pt-3 space-y-2 text-3xs text-slate-500 font-mono">
              <div className="flex items-center justify-between">
                <span>Upload date:</span>
                <span>{new Date(contract.uploadDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>File extension:</span>
                <span>{contract.fileName.split('.').pop()?.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Section: Operational purging controls */}
          <div className="rounded-2xl border border-red-500/10 bg-red-500/3 p-4 space-y-3 glass-panel">
            <h4 className="font-heading font-extrabold text-[10px] uppercase tracking-wider text-red-400">Destructive Actions</h4>
            <p className="text-[10px] text-slate-400 leading-normal">
              Permanently delete this contract, its layout partitions, and its parsed text representations.
            </p>
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="w-full rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 text-2xs font-semibold border border-red-500/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trash2 size={12} />
              <span>Purge Agreement</span>
            </button>
          </div>

        </div>

      </div>

      {/* CONFIRM DELETE MODAL DIALOG */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-red-500/10 bg-[#111827] p-5 shadow-2xl space-y-4 text-center">
            <div className="flex justify-center text-red-400">
              <Trash2 size={36} />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-slate-200">Purge Agreement?</h3>
              <p className="text-2xs text-slate-400 leading-relaxed max-w-[280px] mx-auto">
                Are you sure you want to permanently delete this contract? This deletes the Firestore record, physical file, and outline metadata. This action is irreversible.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2 text-xs">
              <button 
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="rounded-lg bg-white/5 hover:bg-white/10 px-4 py-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-lg bg-red-500 hover:bg-red-600 px-4 py-2 font-semibold text-white transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    <span>Purging...</span>
                  </>
                ) : (
                  <span>Delete Contract</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </PageContainer>
  );
};

export default ContractDetails;

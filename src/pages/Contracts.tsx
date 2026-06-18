import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  FileText, 
  Calendar, 
  SlidersHorizontal,
  Download,
  Trash2,
  Edit3,
  Plus,
  Clock,
  RefreshCw,
  Check,
  X
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { EmptyState } from '../components/ui/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Contract, ContractStatus, ContractCategory } from '../types/contractTypes';
import { ContractUploader } from '../components/ui/ContractUploader';

export const Contracts: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Search, Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedStatus, sortBy]);

  // Modals & Action States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    // Fetch contracts matching current user UID
    const q = query(
      collection(db, 'contracts'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedContracts: Contract[] = [];
      snapshot.forEach((doc) => {
        fetchedContracts.push(doc.data() as Contract);
      });
      setContracts(fetchedContracts);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching contracts:', err);
      showToast('Failed to load contracts database.', 'error');
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser, showToast]);

  const handleRename = async (contractId: string) => {
    if (!renameName.trim()) {
      showToast('Name cannot be empty.', 'error');
      return;
    }

    try {
      const contractRef = doc(db, 'contracts', contractId);
      await updateDoc(contractRef, { contractName: renameName.trim() });
      showToast('Contract renamed successfully.', 'success');
      setRenameId(null);
    } catch (err) {
      showToast('Failed to rename contract.', 'error');
    }
  };

  const handleDelete = async (contractId: string) => {
    setIsDeleting(true);
    try {
      if (!currentUser) return;

      // 1. Delete Firestore Document directly from client
      const contractRef = doc(db, 'contracts', contractId);
      await deleteDoc(contractRef);

      // 2. Trigger local backend file deletion cleanup (non-blocking)
      await fetch(`https://jurisai-feks.onrender.com/api/contracts/${currentUser.uid}/${contractId}`, {
        method: 'DELETE'
      });

      showToast('Contract successfully purged.', 'success');
      setDeleteId(null);
    } catch (err: any) {
      showToast(err.message || 'Deletion failed.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedStatus('All');
    setSortBy('date-desc');
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getStatusStyle = (status: ContractStatus) => {
    switch (status) {
      case 'uploaded':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      case 'processing':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse';
      case 'parsed':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'analysis_pending':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getStatusText = (status: ContractStatus) => {
    switch (status) {
      case 'uploaded': return 'Uploaded';
      case 'processing': return 'Parsing Layout';
      case 'parsed': return 'Document Parsed';
      case 'analysis_pending': return 'AI Ready';
      default: return status;
    }
  };

  // Perform Client-side Filter, Search, and Sort
  const processedContracts = contracts
    .filter((contract) => {
      const matchesSearch = contract.contractName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            contract.fileName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'All' || contract.contractCategory === selectedCategory;
      const matchesStatus = selectedStatus === 'All' || contract.status === selectedStatus;
      
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
      }
      if (sortBy === 'date-asc') {
        return new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
      }
      if (sortBy === 'name-asc') {
        return a.contractName.localeCompare(b.contractName);
      }
      if (sortBy === 'name-desc') {
        return b.contractName.localeCompare(a.contractName);
      }
      if (sortBy === 'size-desc') {
        return b.fileSize - a.fileSize;
      }
      return 0;
    });

  const totalPages = Math.ceil(processedContracts.length / itemsPerPage);
  const paginatedContracts = processedContracts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const categories: ContractCategory[] = ['NDA', 'Employment', 'Vendor', 'Partnership', 'SaaS', 'DPA', 'Other'];
  const statuses: ContractStatus[] = ['uploaded', 'processing', 'parsed', 'analysis_pending'];

  return (
    <PageContainer
      title="Contracts Vault"
      subtitle="Ingest, parse structure, and manage active corporate agreements and legal docs."
      action={
        <div className="flex items-center gap-3">
          {/* View Mode Selectors */}
          <div className="flex items-center rounded-xl border border-white/5 bg-white/3 p-1">
            <button 
              onClick={() => setViewMode('grid')}
              className={`rounded-lg p-1.5 transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}
              title="Grid View"
            >
              <Grid size={15} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`rounded-lg p-1.5 transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}
              title="List View"
            >
              <List size={15} />
            </button>
          </div>

          {/* Ingest Action Button */}
          <button 
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2 text-xs font-semibold text-white hover:opacity-95 shadow-md shadow-primary/10 transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>Ingest Document</span>
          </button>
        </div>
      }
    >
      
      {/* Filtering Search Bar Panel */}
      <div className="rounded-2xl border border-white/5 bg-[#111827]/10 p-5 backdrop-blur-md space-y-4 text-left">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
          {/* Search Input */}
          <div className="relative sm:col-span-4">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
              <Search size={16} />
            </span>
            <input 
              type="text" 
              placeholder="Search contract title or filename..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/5 bg-white/3 py-2 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-500 outline-none transition-all focus:border-primary/50 focus:bg-white/5"
            />
          </div>

          {/* Category Dropdown */}
          <div className="relative sm:col-span-3">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
              <SlidersHorizontal size={14} />
            </span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl border border-white/5 bg-[#111827] py-2 pl-10 pr-4 text-xs text-slate-300 outline-none cursor-pointer appearance-none focus:border-primary/50"
            >
              <option value="All">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="relative sm:col-span-3">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
              <Filter size={14} />
            </span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-xl border border-white/5 bg-[#111827] py-2 pl-10 pr-4 text-xs text-slate-300 outline-none cursor-pointer appearance-none focus:border-primary/50"
            >
              <option value="All">All Statuses</option>
              {statuses.map(st => (
                <option key={st} value={st}>{getStatusText(st)}</option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="relative sm:col-span-2">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
              <Clock size={14} />
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full rounded-xl border border-white/5 bg-[#111827] py-2 pl-10 pr-4 text-xs text-slate-300 outline-none cursor-pointer appearance-none focus:border-primary/50"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="size-desc">Largest Size</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Document Repository Loader */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <RefreshCw className="animate-spin text-primary h-8 w-8 mb-3" />
          <p className="text-xs text-slate-400 font-medium">Querying Legal Repository Vault...</p>
        </div>
      ) : processedContracts.length === 0 ? (
        <EmptyState 
          title={contracts.length === 0 ? "No Contracts in Vault" : "No Matches Found"} 
          description={contracts.length === 0 ? "You have not ingested any legal documents yet. Start uploading files to run layout partition analysis." : "We couldn't find any agreements matching your criteria. Reset filters to show full repository."}
          actionLabel={contracts.length === 0 ? "Ingest First Contract" : "Reset Filters"}
          onAction={contracts.length === 0 ? () => setShowUploadModal(true) : handleResetFilters}
        />
      ) : viewMode === 'grid' ? (
        
        /* Grid Layout */
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 text-left">
          {paginatedContracts.map((contract) => (
            <div 
              key={contract.contractId}
              className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[#111827]/30 p-5 backdrop-blur-md transition-all duration-300 hover:border-primary/30 hover:bg-[#111827]/50 hover:shadow-[0_0_25px_rgba(6,182,212,0.04)] flex flex-col justify-between"
            >
              
              {/* Card Body */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div 
                    onClick={() => navigate(`/contracts/${contract.contractId}`)}
                    className="rounded-xl bg-white/5 p-2.5 text-indigo-400 group-hover:bg-primary/10 group-hover:text-white transition-all duration-300 border border-white/5 cursor-pointer"
                  >
                    <FileText size={20} />
                  </div>
                  
                  {/* Status Indicator Badge */}
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-3xs font-bold uppercase tracking-wider ${getStatusStyle(contract.status)}`}>
                    {getStatusText(contract.status)}
                  </span>
                </div>

                {/* Title (Interactive / Editable Name) */}
                <div className="space-y-1">
                  {renameId === contract.contractId ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <input 
                        type="text" 
                        value={renameName} 
                        onChange={(e) => setRenameName(e.target.value)}
                        className="rounded-lg border border-primary bg-black/40 py-1 px-2 text-xs text-white outline-none w-full"
                        autoFocus
                      />
                      <button 
                        onClick={() => handleRename(contract.contractId)}
                        className="p-1 rounded bg-green-500/10 hover:bg-green-500/20 text-green-400 cursor-pointer"
                      >
                        <Check size={12} />
                      </button>
                      <button 
                        onClick={() => setRenameId(null)}
                        className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <h3 
                        onClick={() => navigate(`/contracts/${contract.contractId}`)}
                        className="font-heading font-bold text-sm text-slate-100 group-hover:text-white transition-colors truncate cursor-pointer flex-1"
                      >
                        {contract.contractName}
                      </h3>
                      <button 
                        onClick={() => { setRenameId(contract.contractId); setRenameName(contract.contractName); }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white transition-opacity cursor-pointer shrink-0"
                        title="Rename Contract"
                      >
                        <Edit3 size={12} />
                      </button>
                    </div>
                  )}

                  <p className="text-3xs font-semibold text-slate-500 uppercase tracking-wider">
                    {contract.contractCategory} • {formatBytes(contract.fileSize)}
                  </p>
                </div>

                {/* Metadata Extracts info summary */}
                <div className="rounded-xl bg-black/15 border border-white/3 p-3 space-y-1.5 text-2xs text-slate-400">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Parties:</span>
                    <span className="font-medium text-slate-300 truncate max-w-[130px]" title={contract.parties.join(', ')}>
                      {contract.parties.length > 0 ? contract.parties.join(' & ') : 'Not Extracted'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Effective Date:</span>
                    <span className="font-mono text-slate-300">
                      {contract.effectiveDate || 'Not Detected'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Document Length:</span>
                    <span className="text-slate-300 font-semibold">
                      {contract.status === 'parsed' || contract.status === 'analysis_pending' 
                        ? `${contract.pageCount} ${contract.pageCount === 1 ? 'Page' : 'Pages'} (${contract.wordCount} words)` 
                        : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Actions Bottom */}
              <div className="mt-5 border-t border-white/5 pt-3 flex items-center justify-between">
                <span className="text-3xs font-mono text-slate-500 flex items-center gap-1">
                  <Calendar size={10} /> {new Date(contract.uploadDate).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-2">
                  {/* Download Original File */}
                  <a 
                    href={contract.storageUrl}
                    download={contract.fileName}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg border border-white/5 bg-white/2 text-slate-400 hover:text-white hover:bg-white/5 transition-colors shrink-0"
                    title="Download Original File"
                  >
                    <Download size={12} />
                  </a>

                  {/* Delete Trigger */}
                  <button 
                    onClick={() => setDeleteId(contract.contractId)}
                    className="p-1.5 rounded-lg border border-red-500/10 bg-red-500/5 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors shrink-0 cursor-pointer"
                    title="Purge Agreement"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      ) : (
        
        /* List Layout */
        <div className="space-y-3 text-left">
          {paginatedContracts.map((contract) => (
            <div 
              key={contract.contractId}
              className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-white/5 bg-[#111827]/20 p-4 hover:border-primary/20 hover:bg-[#111827]/40 transition-all duration-300"
            >
              <div 
                onClick={() => navigate(`/contracts/${contract.contractId}`)}
                className="flex items-center gap-4 cursor-pointer flex-1 min-w-0"
              >
                <div className="rounded-xl bg-white/5 p-2.5 text-indigo-400 border border-white/5 shrink-0">
                  <FileText size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-heading font-bold text-sm text-slate-200 group-hover:text-white transition-colors truncate">
                    {contract.contractName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-3xs text-slate-400 font-semibold">
                    <span>{contract.contractCategory}</span>
                    <span className="text-slate-700 font-xs">•</span>
                    <span>{formatBytes(contract.fileSize)}</span>
                    <span className="text-slate-700 font-xs">•</span>
                    <span>{contract.pageCount} Pages</span>
                    <span className="text-slate-700 font-xs">•</span>
                    <span>Uploaded: {new Date(contract.uploadDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Status & Action Blocks */}
              <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 border-t sm:border-0 border-white/5 pt-3 sm:pt-0">
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-3xs font-bold uppercase tracking-wider ${getStatusStyle(contract.status)}`}>
                  {getStatusText(contract.status)}
                </span>

                <div className="flex items-center gap-2">
                  {/* Inline Renaming Trigger */}
                  <button 
                    onClick={() => { setRenameId(contract.contractId); setRenameName(contract.contractName); }}
                    className="p-1.5 rounded-lg border border-white/5 bg-white/2 text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    title="Rename"
                  >
                    <Edit3 size={12} />
                  </button>

                  <a 
                    href={contract.storageUrl}
                    download={contract.fileName}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg border border-white/5 bg-white/2 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    title="Download"
                  >
                    <Download size={12} />
                  </a>

                  <button 
                    onClick={() => setDeleteId(contract.contractId)}
                    className="p-1.5 rounded-lg border border-red-500/10 bg-red-500/5 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-white/5 pt-6 mt-6">
          <p className="text-3xs text-slate-500 font-mono font-medium">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, processedContracts.length)} of {processedContracts.length} agreements
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-white/5 bg-[#111827]/30 px-3 py-1.5 text-3xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Previous
            </button>
            <span className="text-3xs font-mono text-slate-400 font-semibold px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-white/5 bg-[#111827]/30 px-3 py-1.5 text-3xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* RENAME MODAL DIALOG */}
      {renameId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#111827] p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-slate-200">
              <Edit3 size={16} className="text-primary" />
              <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider">Rename Agreement</h3>
            </div>
            <input 
              type="text" 
              value={renameName} 
              onChange={(e) => setRenameName(e.target.value)}
              className="w-full rounded-xl border border-white/5 bg-black/20 py-2 px-3 text-xs text-slate-200 outline-none focus:border-primary"
              placeholder="Contract Display Name"
            />
            <div className="flex justify-end gap-2 pt-2 text-xs">
              <button 
                onClick={() => setRenameId(null)}
                className="rounded-lg bg-white/5 hover:bg-white/10 px-3 py-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleRename(renameId)}
                className="rounded-lg bg-gradient-to-r from-primary to-secondary px-3 py-1.5 font-semibold text-white cursor-pointer"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL DIALOG */}
      {deleteId && (
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
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
                className="rounded-lg bg-white/5 hover:bg-white/10 px-4 py-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDelete(deleteId)}
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

      {/* UPLOAD MULTIPART MODAL DIALOG */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md">
            <ContractUploader 
              onClose={() => setShowUploadModal(false)}
              onUploadComplete={(cid) => {
                setShowUploadModal(false);
                navigate(`/contracts/${cid}`);
              }}
            />
          </div>
        </div>
      )}

    </PageContainer>
  );
};

export default Contracts;

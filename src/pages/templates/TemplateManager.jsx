import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Layout,
    Plus,
    Edit3,
    Trash2,
    Copy,
    Star,
    MoreVertical,
    Loader2,
    Package,
    Eye,
    Search,
    X,
    Check,
    AlertCircle
} from 'lucide-react';
import { useTemplates } from '../../hooks/useTemplates';

export default function TemplateManager() {
    const navigate = useNavigate();
    const {
        templates,
        loading,
        saving,
        error,
        createTemplate,
        deleteTemplate,
        duplicateTemplate,
        setDefaultTemplate,
        getProductCountForTemplate
    } = useTemplates();

    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [createError, setCreateError] = useState('');
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [productCounts, setProductCounts] = useState({});
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Fetch product counts for each template
    useEffect(() => {
        const fetchCounts = async () => {
            const counts = {};
            for (const template of templates) {
                counts[template.id] = await getProductCountForTemplate(template.id);
            }
            setProductCounts(counts);
        };

        if (templates.length > 0) {
            fetchCounts();
        }
    }, [templates, getProductCountForTemplate]);

    // Filter templates based on search
    const filteredTemplates = templates.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Handle create template
    const handleCreate = async () => {
        if (!newTemplateName.trim()) {
            setCreateError('Please enter a template name');
            return;
        }

        const result = await createTemplate(newTemplateName.trim());
        if (result.success) {
            setShowCreateModal(false);
            setNewTemplateName('');
            setCreateError('');
            // Navigate to the editor
            navigate(`/store/templates/${result.data.id}/edit`);
        } else {
            setCreateError(result.error || 'Failed to create template');
        }
    };

    // Handle delete template
    const handleDelete = async (templateId) => {
        const result = await deleteTemplate(templateId);
        if (result.success) {
            setDeleteConfirm(null);
            setActiveDropdown(null);
        }
    };

    // Handle duplicate template
    const handleDuplicate = async (templateId) => {
        const result = await duplicateTemplate(templateId);
        if (result.success) {
            setActiveDropdown(null);
        }
    };

    // Handle set as default
    const handleSetDefault = async (templateId) => {
        await setDefaultTemplate(templateId);
        setActiveDropdown(null);
    };

    // Handle edit template
    const handleEdit = (templateId) => {
        navigate(`/store/templates/${templateId}/edit`);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (activeDropdown && !e.target.closest('.dropdown-menu')) {
                setActiveDropdown(null);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [activeDropdown]);

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading templates...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-[32px] font-semibold text-[#1F1F1F]">
                        Product Page Templates
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Create custom layouts for your product pages
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
                >
                    <Plus size={20} />
                    Create Template
                </button>
            </div>

            {/* Search Bar */}
            {templates.length > 0 && (
                <div className="mb-6">
                    <div className="relative max-w-md">
                        <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {/* Templates Grid */}
            {templates.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
                        <Layout size={40} className="text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        No templates yet
                    </h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        Create your first product page template to customize how individual products are displayed to customers.
                    </p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
                    >
                        <Plus size={20} />
                        Create Your First Template
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTemplates.map((template) => (
                        <div
                            key={template.id}
                            className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group"
                        >
                            {/* Template Preview Card */}
                            <div className="relative h-44 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
                                {/* Abstract Layout Preview */}
                                <div className="w-3/4 h-3/4 bg-white rounded-lg shadow-sm border border-gray-200 p-3 flex gap-3">
                                    <div className="w-1/2 bg-gray-200 rounded-md" />
                                    <div className="w-1/2 space-y-2">
                                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                                        <div className="h-6 bg-gray-200 rounded w-2/3 mt-4" />
                                        <div className="h-8 bg-blue-200 rounded w-full mt-2" />
                                    </div>
                                </div>

                                {/* Default Badge */}
                                {template.is_default && (
                                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                                        <Star size={12} fill="currentColor" />
                                        Default
                                    </div>
                                )}

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <button
                                        onClick={() => handleEdit(template.id)}
                                        className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition"
                                    >
                                        <Edit3 size={16} />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleEdit(template.id)}
                                        className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition backdrop-blur-sm"
                                    >
                                        <Eye size={16} />
                                        Preview
                                    </button>
                                </div>
                            </div>

                            {/* Template Info */}
                            <div className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 truncate">
                                            {template.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                                            <Package size={14} />
                                            {productCounts[template.id] || 0} products using this template
                                        </p>
                                    </div>

                                    {/* Dropdown Menu */}
                                    <div className="relative dropdown-menu">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveDropdown(activeDropdown === template.id ? null : template.id);
                                            }}
                                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                        >
                                            <MoreVertical size={18} />
                                        </button>

                                        {activeDropdown === template.id && (
                                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                                                <button
                                                    onClick={() => handleEdit(template.id)}
                                                    className="w-full flex items-center gap-2 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition"
                                                >
                                                    <Edit3 size={16} />
                                                    Edit Template
                                                </button>
                                                <button
                                                    onClick={() => handleDuplicate(template.id)}
                                                    disabled={saving}
                                                    className="w-full flex items-center gap-2 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                                                >
                                                    <Copy size={16} />
                                                    Duplicate
                                                </button>
                                                {!template.is_default && (
                                                    <button
                                                        onClick={() => handleSetDefault(template.id)}
                                                        disabled={saving}
                                                        className="w-full flex items-center gap-2 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                                                    >
                                                        <Star size={16} />
                                                        Set as Default
                                                    </button>
                                                )}
                                                <hr className="my-1 border-gray-200" />
                                                <button
                                                    onClick={() => setDeleteConfirm(template.id)}
                                                    className="w-full flex items-center gap-2 px-4 py-2 text-left text-red-600 hover:bg-red-50 transition"
                                                >
                                                    <Trash2 size={16} />
                                                    Delete Template
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Section count */}
                                <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                                    <Layout size={12} />
                                    {(template.sections || []).length} sections
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* No search results */}
            {templates.length > 0 && filteredTemplates.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                    <Search size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                        No templates found
                    </h3>
                    <p className="text-gray-500">
                        No templates match "{searchQuery}"
                    </p>
                </div>
            )}

            {/* Create Template Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Create New Template
                            </h2>
                            <p className="text-gray-500 text-sm mt-1">
                                Start with the default layout and customize it
                            </p>
                        </div>

                        <div className="p-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Template Name
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., Premium Layout, Minimal, Gallery Style"
                                value={newTemplateName}
                                onChange={(e) => {
                                    setNewTemplateName(e.target.value);
                                    setCreateError('');
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCreate();
                                }}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                autoFocus
                            />
                            {createError && (
                                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                    <AlertCircle size={14} />
                                    {createError}
                                </p>
                            )}
                        </div>

                        <div className="p-6 pt-0 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setNewTemplateName('');
                                    setCreateError('');
                                }}
                                className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={saving || !newTemplateName.trim()}
                                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Check size={18} />
                                        Create Template
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                        <div className="p-6">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={24} className="text-red-600" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
                                Delete Template?
                            </h2>
                            <p className="text-gray-500 text-center">
                                This action cannot be undone. Products using this template will revert to the default layout.
                            </p>
                        </div>

                        <div className="p-6 pt-0 flex justify-center gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                disabled={saving}
                                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={18} />
                                        Delete Template
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

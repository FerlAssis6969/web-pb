import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, CheckCircle, AlertCircle, FileJson, ArrowLeft, Database, Users, Activity } from 'lucide-react';

export default function BlobUploader() {
    const navigate = useNavigate();
    const [files, setFiles] = useState({
        records: null,
        users: null,
        stats: null
    });
    const [uploading, setUploading] = useState(false);
    const [results, setResults] = useState([]);
    const [error, setError] = useState(null);

    const handleFileChange = (storeName, e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.type === 'application/json') {
                setFiles(prev => ({ ...prev, [storeName]: selectedFile }));
                setError(null);
            } else {
                setError('Bitte wählen Sie eine JSON-Datei aus');
            }
        }
    };

    const uploadStore = async (storeName, file, key) => {
        try {
            const fileContent = await file.text();
            const data = JSON.parse(fileContent);

            const response = await fetch('/.netlify/functions/uploadBlobs', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    storeName: storeName,
                    key: key,
                    data: data
                })
            });

            const responseData = await response.json();

            if (response.ok) {
                return {
                    success: true,
                    storeName,
                    key,
                    message: responseData.message,
                    timestamp: responseData.timestamp,
                    dataSize: JSON.stringify(data).length
                };
            } else {
                throw new Error(responseData.error || 'Upload fehlgeschlagen');
            }
        } catch (err) {
            return {
                success: false,
                storeName,
                key,
                error: err.message
            };
        }
    };

    const handleUploadAll = async () => {
        const selectedFiles = Object.entries(files).filter(([_, file]) => file !== null);

        if (selectedFiles.length === 0) {
            setError('Bitte wählen Sie mindestens eine Datei aus');
            return;
        }

        setUploading(true);
        setError(null);
        setResults([]);

        const uploadTasks = [];

        // Upload records/data
        if (files.records) {
            uploadTasks.push(uploadStore('records', files.records, 'data'));
        }

        // Upload users/all_users
        if (files.users) {
            uploadTasks.push(uploadStore('users', files.users, 'all_users'));
        }

        // Upload stats/recent_logs
        if (files.stats) {
            uploadTasks.push(uploadStore('stats', files.stats, 'recent_logs'));
        }

        try {
            const uploadResults = await Promise.all(uploadTasks);
            setResults(uploadResults);
        } catch (err) {
            setError('Fehler beim Hochladen: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const storeConfigs = [
        {
            name: 'records',
            key: 'data',
            label: 'Records',
            description: 'Main database records',
            icon: Database,
            color: 'text-blue-400',
            hint: 'records/data.json'
        },
        {
            name: 'users',
            key: 'all_users',
            label: 'Users',
            description: 'User accounts and roles',
            icon: Users,
            color: 'text-purple-400',
            hint: 'users/all_users.json'
        },
        {
            name: 'stats',
            key: 'recent_logs',
            label: 'Statistics',
            description: 'Activity logs and metrics',
            icon: Activity,
            color: 'text-green-400',
            hint: 'stats/recent_logs.json'
        }
    ];

    return (
        <div className="min-h-screen p-4 md:p-8 pt-20 text-white">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <header className="flex justify-between items-center glass-panel p-6 rounded-2xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl">
                            <Upload className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Data Management</h1>
                            <p className="text-gray-400 text-sm">Upload and restore system data</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-4 py-2 rounded-lg glass-button text-gray-400 hover:text-white flex items-center gap-2"
                    >
                        <ArrowLeft size={18} /> Back to Dashboard
                    </button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Upload Cards */}
                    {storeConfigs.map(config => {
                        const Icon = config.icon;
                        const file = files[config.name];
                        const result = results.find(r => r.storeName === config.name);

                        return (
                            <div key={config.name} className="glass-panel p-6 rounded-2xl flex flex-col relative overflow-hidden group">
                                <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${config.color}`}>
                                    <Icon size={100} />
                                </div>

                                <div className="flex items-center gap-3 mb-4 relative z-10">
                                    <Icon className={`w-5 h-5 ${config.color}`} />
                                    <h3 className="font-bold text-lg">{config.label}</h3>
                                </div>

                                <p className="text-sm text-gray-400 mb-6 relative z-10 min-h-[40px]">
                                    {config.description}
                                </p>

                                <div className="mt-auto relative z-10 space-y-3">
                                    <label className="block w-full cursor-pointer group/input">
                                        <input
                                            type="file"
                                            accept=".json"
                                            onChange={(e) => handleFileChange(config.name, e)}
                                            className="hidden"
                                        />
                                        <div className={`
                                            w-full p-3 rounded-xl border border-dashed transition-all
                                            flex items-center justify-center gap-2 text-sm font-medium
                                            ${file
                                                ? 'border-green-500/50 bg-green-500/10 text-green-400'
                                                : 'border-white/10 bg-black/20 text-gray-400 group-hover/input:border-white/20 group-hover/input:text-white'
                                            }
                                        `}>
                                            {file ? (
                                                <>
                                                    <CheckCircle size={16} />
                                                    <span className="truncate max-w-[150px]">{file.name}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FileJson size={16} />
                                                    <span>Select JSON</span>
                                                </>
                                            )}
                                        </div>
                                    </label>

                                    {result && (
                                        <div className={`text-xs p-2 rounded-lg flex items-center gap-2 ${result.success ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                            }`}>
                                            {result.success ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                                            <span>{result.success ? 'Upload Successful' : 'Failed'}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Action Bar */}
                <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                        <AlertCircle size={16} className="text-yellow-500" />
                        <p>Warning: Uploading will overwrite existing data in the selected stores.</p>
                    </div>

                    <button
                        onClick={handleUploadAll}
                        disabled={Object.values(files).every(f => f === null) || uploading}
                        className="glass-button px-8 py-3 rounded-xl text-white font-bold flex items-center gap-2 disabled:opacity-50 bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/50"
                    >
                        {uploading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                Processing...
                            </>
                        ) : (
                            <>
                                <Upload size={20} />
                                Upload Selected
                            </>
                        )}
                    </button>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-400">
                        <AlertCircle size={20} />
                        <p>{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

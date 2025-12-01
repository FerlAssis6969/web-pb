import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, FileJson } from 'lucide-react';

export default function BlobUploader() {
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
            label: 'Records (Datensätze)',
            description: 'Hauptdaten mit allen Records',
            hint: '.netlify/blobs/deploy/records/data.json'
        },
        {
            name: 'users',
            key: 'all_users',
            label: 'Users (Benutzer)',
            description: 'Alle Benutzer und deren Daten',
            hint: '.netlify/blobs/deploy/users/all_users.json'
        },
        {
            name: 'stats',
            key: 'recent_logs',
            label: 'Stats (Statistiken)',
            description: 'Aktivitätslogs und Statistiken',
            hint: '.netlify/blobs/deploy/stats/recent_logs.json'
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 shadow-2xl">
                    <div className="flex items-center gap-3 mb-6">
                        <FileJson className="w-8 h-8 text-blue-400" />
                        <h1 className="text-2xl font-bold text-white">Blob-Daten hochladen</h1>
                    </div>

                    <p className="text-slate-300 mb-6">
                        Laden Sie Ihre lokalen Blob-Daten wieder auf Netlify hoch. Sie können mehrere Stores gleichzeitig hochladen.
                    </p>

                    {/* File Inputs for each store */}
                    <div className="space-y-4 mb-6">
                        {storeConfigs.map(config => (
                            <div key={config.name} className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4">
                                <div className="mb-2">
                                    <h3 className="text-sm font-semibold text-white">{config.label}</h3>
                                    <p className="text-xs text-slate-400">{config.description}</p>
                                    <p className="text-xs text-slate-500 font-mono mt-1">{config.hint}</p>
                                </div>
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={(e) => handleFileChange(config.name, e)}
                                    className="block w-full text-sm text-slate-400
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-lg file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-blue-500 file:text-white
                                        hover:file:bg-blue-600
                                        file:cursor-pointer cursor-pointer
                                        border border-slate-600 rounded-lg
                                        bg-slate-700/50"
                                />
                                {files[config.name] && (
                                    <p className="mt-2 text-sm text-green-400 flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        {files[config.name].name} ({(files[config.name].size / 1024).toFixed(2)} KB)
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Upload Button */}
                    <button
                        onClick={handleUploadAll}
                        disabled={Object.values(files).every(f => f === null) || uploading}
                        className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 
                            disabled:bg-slate-600 disabled:cursor-not-allowed
                            text-white font-semibold py-3 px-6 rounded-lg 
                            transition-all duration-200 transform hover:scale-[1.02]
                            disabled:transform-none shadow-lg"
                    >
                        {uploading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                Wird hochgeladen...
                            </>
                        ) : (
                            <>
                                <Upload className="w-5 h-5" />
                                Alle ausgewählten Daten hochladen
                            </>
                        )}
                    </button>

                    {/* Results */}
                    {results.length > 0 && (
                        <div className="mt-6 space-y-3">
                            {results.map((result, idx) => (
                                <div
                                    key={idx}
                                    className={`p-4 rounded-lg border ${result.success
                                            ? 'bg-green-500/10 border-green-500/50'
                                            : 'bg-red-500/10 border-red-500/50'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        {result.success ? (
                                            <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                                        ) : (
                                            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                                        )}
                                        <div className="flex-1">
                                            <h3 className={`font-semibold mb-1 ${result.success ? 'text-green-400' : 'text-red-400'
                                                }`}>
                                                {result.storeName}/{result.key}
                                            </h3>
                                            {result.success ? (
                                                <>
                                                    <p className="text-sm text-green-300 mb-1">{result.message}</p>
                                                    <div className="text-xs text-green-400/80 space-y-1">
                                                        <p>• Größe: {(result.dataSize / 1024).toFixed(2)} KB</p>
                                                        <p>• Zeitstempel: {new Date(result.timestamp).toLocaleString('de-DE')}</p>
                                                    </div>
                                                </>
                                            ) : (
                                                <p className="text-sm text-red-300">{result.error}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-red-400 mb-1">Fehler</h3>
                                    <p className="text-sm text-red-300">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="mt-8 p-4 bg-slate-700/30 border border-slate-600/50 rounded-lg">
                        <h3 className="font-semibold text-slate-300 mb-2">Anleitung:</h3>
                        <ol className="text-sm text-slate-400 space-y-1 list-decimal list-inside">
                            <li>Wählen Sie die lokalen JSON-Dateien aus (eine oder mehrere)</li>
                            <li>Klicken Sie auf "Alle ausgewählten Daten hochladen"</li>
                            <li>Die Daten werden zu den entsprechenden Netlify Blobs hochgeladen</li>
                            <li>Nach erfolgreicher Upload können Sie die Seite neu laden</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
}

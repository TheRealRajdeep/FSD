import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { ClipboardList, Upload, File, X, Check, AlertCircle, Download, CheckSquare } from 'lucide-react';
import AuthContext from '../../context/AuthContext';

interface ProjectResult {
    projectName: string;
    evaluationId?: string;
    success?: boolean;
    error?: string;
    hasPrefilledScores?: boolean;
}

const ExcelEvaluationCreate: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [previewData, setPreviewData] = useState<any[] | null>(null);
    const [projectResults, setProjectResults] = useState<ProjectResult[]>([]);
    const [uploadCompleted, setUploadCompleted] = useState(false);
    const [evaluationType, setEvaluationType] = useState<string>('milestone');
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (!selectedFile.name.endsWith('.xlsx')) {
                toast.error('Please upload only Excel (.xlsx) files');
                return;
            }
            setFile(selectedFile);

            // Preview Excel data
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const { read, utils } = await import('xlsx');
                    const data = new Uint8Array(event.target?.result as ArrayBuffer);
                    const workbook = read(data, { type: 'array' });
                    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = utils.sheet_to_json(worksheet);

                    // Define types for Excel row data
                    interface ExcelRow {
                        ProjectName: string;
                        [key: string]: any;
                    }

                    // Group preview data by project name for display
                    const groupedData: Record<string, ExcelRow[]> = {};
                    (jsonData as ExcelRow[]).forEach(row => {
                        if (row.ProjectName) {
                            if (!groupedData[row.ProjectName]) {
                                groupedData[row.ProjectName] = [];
                            }
                            groupedData[row.ProjectName].push(row);
                        }
                    });

                    // Take a few rows from each project for preview
                    let previewRows: ExcelRow[] = [];
                    Object.keys(groupedData).forEach(projectName => {
                        const projectRows = groupedData[projectName].slice(0, 2); // 2 rows per project
                        previewRows = [...previewRows, ...projectRows];
                    });

                    setPreviewData(previewRows.slice(0, 5));
                } catch (error) {
                    console.error('Error reading Excel file:', error);
                    toast.error('Failed to read Excel file');
                }
            };
            reader.readAsArrayBuffer(selectedFile);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            toast.error('Please select an Excel file');
            return;
        }

        const formData = new FormData();
        formData.append('excelFile', file);
        formData.append('evaluationType', evaluationType);

        try {
            setLoading(true);
            const response = await axios.post('/api/evaluations/excel-upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setProjectResults(response.data.projectResults);
            setUploadCompleted(true);
            toast.success('Excel file processed successfully');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to process Excel file');
        } finally {
            setLoading(false);
        }
    };

    const navigateToEvaluation = (evaluationId: string) => {
        navigate(`/evaluations/${evaluationId}`);
    };

    const clearFile = () => {
        setFile(null);
        setPreviewData(null);
        setUploadCompleted(false);
        setProjectResults([]);
    };

    const downloadTemplate = async () => {
        try {
            const { utils, write } = await import('xlsx');

            // Create template data with project info and criteria columns
            const templateData = [
                {
                    ProjectName: 'Project Alpha',
                    'Code Quality': '', // Empty column for faculty to enter scores (0-5)
                    'Design': '',       // Empty column for faculty to enter scores (0-5)
                    'Documentation': '', // Empty column for faculty to enter scores (0-5)
                    'Presentation': '',  // Empty column for faculty to enter scores (0-5)
                    'Innovation': ''     // Empty column for faculty to enter scores (0-5)
                },
                {
                    ProjectName: 'Project Beta',
                    'Code Quality': '',
                    'Design': '',
                    'Documentation': '',
                    'Presentation': '',
                    'Innovation': ''
                }
            ];

            // Create worksheet
            const ws = utils.json_to_sheet(templateData);
            const wb = utils.book_new();
            utils.book_append_sheet(wb, ws, 'Project Evaluations');

            // Generate and download file
            const excelBuffer = write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'project_evaluation_template.xlsx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error('Error generating template:', error);
            toast.error('Failed to download template');
        }
    };

    // Update the upload completed UI to show score status
    if (uploadCompleted && projectResults.length > 0) {
        return (
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-xl shadow-md overflow-hidden p-8">
                    <div className="flex items-center mb-6">
                        <ClipboardList className="h-8 w-8 text-indigo-600 mr-3" />
                        <h1 className="text-2xl font-bold text-gray-800">Excel Upload Results</h1>
                    </div>

                    <div className="mb-6">
                        <p className="text-gray-700 mb-4">
                            Your Excel file has been processed. The following projects are now ready for evaluation:
                        </p>

                        <div className="space-y-4">
                            {projectResults.map((result, index) => (
                                <div
                                    key={index}
                                    className={`p-4 border rounded-lg ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            {result.success ? (
                                                <Check className="h-5 w-5 text-green-500 mr-2" />
                                            ) : (
                                                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                                            )}
                                            <div>
                                                <h3 className="text-lg font-medium">{result.projectName}</h3>
                                                {result.success && result.hasPrefilledScores && (
                                                    <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                        <CheckSquare className="h-3 w-3 mr-1" />
                                                        Scores imported from Excel
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {result.success ? (
                                            <button
                                                onClick={() => navigateToEvaluation(result.evaluationId!)}
                                                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                                            >
                                                {result.hasPrefilledScores ? 'Review Scores' : 'Start Evaluation'}
                                            </button>
                                        ) : (
                                            <span className="text-red-600">{result.error}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-between">
                        <button
                            onClick={clearFile}
                            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition"
                        >
                            Upload Another File
                        </button>

                        <button
                            onClick={() => navigate('/evaluations')}
                            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition"
                        >
                            Go to Evaluations
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-md overflow-hidden p-8">
                <div className="flex items-center mb-6">
                    <ClipboardList className="h-8 w-8 text-indigo-600 mr-3" />
                    <h1 className="text-2xl font-bold text-gray-800">Create Excel-Based Evaluation</h1>
                </div>

                <div className="mb-6 p-4 border border-indigo-100 rounded-lg bg-indigo-50">
                    <h3 className="font-medium text-indigo-800 mb-2">Instructions:</h3>
                    <ol className="list-decimal pl-5 text-gray-700 space-y-1">
                        <li>Download the Excel template below</li>
                        <li>Fill in project names and <strong>evaluation scores</strong> (0-5 for each criterion)</li>
                        <li>You can include multiple projects in a single Excel file</li>
                        <li>Upload the completed Excel file with scores</li>
                        <li>Project-level evaluations will be applied to the entire team</li>
                    </ol>

                    <div className="mt-4 flex space-x-4">
                        <button
                            onClick={downloadTemplate}
                            className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-md hover:bg-indigo-200 transition flex items-center"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Download Template
                        </button>

                        <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-md flex items-center">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            <span className="text-sm">
                                Enter project scores (0-5) directly in the Excel columns
                            </span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-4"></div>
                    <label htmlFor="evaluationType" className="block text-sm font-medium text-gray-700 mb-2">
                        Evaluation Type:
                    </label>
                    <select
                        id="evaluationType"
                        value={evaluationType}
                        onChange={(e) => setEvaluationType(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="milestone">Milestone Evaluation</option>
                        <option value="final">Final Evaluation</option>
                    </select>
                    <p className="mt-2 text-sm text-gray-500">
                        Select whether this is a milestone or final evaluation for the projects in this Excel file.
                    </p>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                        <div className="space-y-2 text-center">
                            {!file ? (
                                <>
                                    <div className="mx-auto flex justify-center">
                                        <Upload className="h-10 w-10 text-gray-400" />
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        <label htmlFor="excel-file" className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                                            <span>Upload Excel file</span>
                                            <input id="excel-file" name="excel-file" type="file" accept=".xlsx" className="sr-only" onChange={handleFileChange} />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500">XLSX up to 5MB</p>
                                </>
                            ) : (
                                <div className="bg-white p-3 rounded-md border border-gray-200 flex justify-between items-center">
                                    <div className="flex items-center">
                                        <File className="h-8 w-8 text-indigo-500 mr-3" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={clearFile}
                                        className="text-gray-400 hover:text-gray-500"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {previewData && previewData.length > 0 && (
                        <div className="mt-4">
                            <div className="overflow-x-auto border rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {previewData[0] && Object.keys(previewData[0]).map((key) => (
                                                <th key={key} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    {key}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {previewData.map((row, rowIndex) => (
                                            <tr key={rowIndex}>
                                                {previewData[0] && Object.keys(previewData[0]).map((key) => (
                                                    <td key={`${rowIndex}-${key}`} className="px-4 py-2 text-sm text-gray-900">
                                                        {row[key]?.toString() || ''}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Showing preview only. Multiple projects detected.</p>
                        </div>
                    )}

                    <div className="flex items-center space-x-4">
                        <button
                            type="submit"
                            disabled={loading || !file}
                            className="bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition disabled:opacity-70"
                        >
                            {loading ? 'Processing...' : 'Upload and Process Excel'}
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate('/evaluations')}
                            className="border border-gray-300 text-gray-700 py-2 px-6 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ExcelEvaluationCreate;

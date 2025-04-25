import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { utils, write } from 'xlsx';
import { saveAs } from 'file-saver';
import { ClipboardList, Download, Upload, Check, Users, Calendar } from 'lucide-react';
import AuthContext from '../../context/AuthContext';

interface ExcelData {
    ProjectName: string;
    [key: string]: any; // For dynamic criteria columns
}

interface Evaluation {
    _id: string;
    project: {
        _id: string;
        title: string;
    };
    team: {
        _id: string;
        name: string;
    };
    evaluationType: string;
    dueDate: string;
    status: string;
    excelData: ExcelData[];
    facultyScoreData: any[];
    reviewerScoreData: any[];
    facultySubmitted: boolean;
    reviewerSubmitted: boolean;
    rubricItems: { criterion: string; facultyMaxScore: number; reviewerMaxScore: number }[];
}

const ExcelEvaluationView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        const fetchEvaluation = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`/api/evaluations/${id}`);
                setEvaluation(res.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching evaluation:', error);
                toast.error('Failed to load evaluation details');
                setLoading(false);
            }
        };

        if (id) {
            fetchEvaluation();
        }
    }, [id]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (!selectedFile.name.endsWith('.xlsx')) {
                toast.error('Please upload only Excel (.xlsx) files');
                return;
            }
            setFile(selectedFile);
        }
    };

    const downloadCurrentExcel = () => {
        if (!evaluation || !evaluation.excelData || evaluation.excelData.length === 0) {
            toast.error('No data available to download');
            return;
        }

        try {
            // Create worksheet from evaluation data
            const ws = utils.json_to_sheet(evaluation.excelData);
            const wb = utils.book_new();
            utils.book_append_sheet(wb, ws, 'Evaluation');

            // Generate Excel file
            const excelBuffer = write(wb, { bookType: 'xlsx', type: 'array' });
            saveAs(
                new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
                `evaluation-${evaluation.project.title}.xlsx`
            );
        } catch (error) {
            console.error('Error generating Excel:', error);
            toast.error('Failed to generate Excel file');
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

        try {
            setSubmitting(true);

            if (user?.role === 'faculty') {
                await axios.put(`/api/evaluations/${id}/excel-faculty-score`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else if (user?.role === 'reviewer') {
                await axios.put(`/api/evaluations/${id}/excel-reviewer-score`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            toast.success('Evaluation submitted successfully!');
            navigate('/evaluations');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to submit evaluation');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Helper function to get max score for a criterion
    const getCriterionMaxScore = (criterionName: string) => {
        // Try to match with standard criteria names
        const criterionMap: { [key: string]: number } = {
            "Implementation Demonstration": 20,
            "Project Recognition": 10,
            "Black Book Draft": 5,
            "Presentation Quality": 5,
            "Contribution & Punctuality": 5
        };

        // Case insensitive search for criterion
        const key = Object.keys(criterionMap).find(
            k => k.toLowerCase() === criterionName.toLowerCase()
        );

        // Return the mapped score or default to 5
        return key ? criterionMap[key] : 5;
    };

    const getTotalScore = (projectData: any, criterionName: string) => {
        const maxScore = getCriterionMaxScore(criterionName);
        const facultyMaxScore = maxScore; // Changed: Use full max score
        const reviewerMaxScore = maxScore; // Changed: Use full max score

        const facultyScore = evaluation?.facultySubmitted ?
            Math.min((projectData[criterionName] || 0), facultyMaxScore) : 0;

        // Find reviewer score in reviewerScoreData if it exists
        const reviewerScoreItem = evaluation?.reviewerScoreData?.find(
            item => item.criterion === criterionName
        );
        const reviewerScore = reviewerScoreItem ?
            Math.min(reviewerScoreItem.score || 0, reviewerMaxScore) : 0;

        return {
            faculty: facultyScore,
            reviewer: reviewerScore,
            total: facultyScore + reviewerScore // This will now be the sum of both full scores
        };
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!evaluation) {
        return <div className="text-center p-8">Evaluation not found</div>;
    }

    const ProjectBadge = () => (
        <div className="inline-flex items-center bg-indigo-100 text-indigo-800 px-3 py-1 rounded-lg border border-indigo-200">
            <span className="mr-1 font-medium">Currently Evaluating:</span> {evaluation.project.title}
        </div>
    );

    const criteriaColumns = evaluation.excelData && evaluation.excelData.length > 0
        ? Object.keys(evaluation.excelData[0]).filter(key => key !== 'ProjectName')
        : [];

    const canSubmitFaculty = user?.role === 'faculty' && !evaluation.facultySubmitted;
    const canSubmitReviewer = user?.role === 'reviewer' && !evaluation.reviewerSubmitted && evaluation.facultySubmitted;

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                        <div className="flex items-center mb-4 md:mb-0">
                            <ClipboardList className="h-8 w-8 text-indigo-600 mr-3" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">
                                    Excel-Based Evaluation
                                </h1>
                                <p className="text-gray-600">{evaluation.project.title}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <ProjectBadge />
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${evaluation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                evaluation.status === 'faculty-evaluated' ? 'bg-blue-100 text-blue-800' :
                                    evaluation.status === 'reviewer-evaluated' ? 'bg-purple-100 text-purple-800' :
                                        'bg-green-100 text-green-800'
                                }`}>
                                {evaluation.status.replace('-', ' ').toUpperCase()}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center mb-3">
                                <Users className="h-5 w-5 text-indigo-600 mr-2" />
                                <h3 className="font-medium text-gray-800">Team</h3>
                            </div>
                            <p className="text-gray-700">{evaluation.team.name}</p>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center mb-3">
                                <Calendar className="h-5 w-5 text-indigo-600 mr-2" />
                                <h3 className="font-medium text-gray-800">Due Date</h3>
                            </div>
                            <p className="text-gray-700">{formatDate(evaluation.dueDate)}</p>
                        </div>
                    </div>

                    {evaluation.excelData && evaluation.excelData.length > 0 ? (
                        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Project Name
                                            </th>
                                            {criteriaColumns.map(column => (
                                                <th key={column} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    {column}
                                                    <div className="text-xxs text-gray-400">
                                                        {(() => {
                                                            const maxScore = getCriterionMaxScore(column);
                                                            return `(Max: ${maxScore} | Faculty: ${maxScore} | Reviewer: ${maxScore})`;
                                                        })()}
                                                    </div>
                                                </th>
                                            ))}
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Total Score
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {evaluation.excelData.filter((item, index, self) =>
                                            // Remove duplicates: only keep unique projects
                                            index === self.findIndex(t => t.ProjectName === item.ProjectName)
                                        ).map((projectData, index) => {
                                            // Calculate total score for this project
                                            const totalScoreObj = criteriaColumns.reduce(
                                                (acc, column) => {
                                                    const scores = getTotalScore(projectData, column);
                                                    return {
                                                        faculty: acc.faculty + scores.faculty,
                                                        reviewer: acc.reviewer + scores.reviewer,
                                                        total: acc.total + scores.total
                                                    };
                                                },
                                                { faculty: 0, reviewer: 0, total: 0 }
                                            );

                                            return (
                                                <tr key={index}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">{projectData.ProjectName}</div>
                                                    </td>
                                                    {criteriaColumns.map(column => (
                                                        <td key={`${index}-${column}`} className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">
                                                                {evaluation.facultySubmitted ? (
                                                                    <div>
                                                                        <span className="font-medium">Faculty:</span> {Math.min(projectData[column] || 0, getCriterionMaxScore(column))}
                                                                        {evaluation.reviewerSubmitted && (
                                                                            <>
                                                                                <br />
                                                                                <span className="font-medium">Reviewer:</span> {
                                                                                    Math.min(
                                                                                        evaluation.reviewerScoreData?.find(
                                                                                            item => item.criterion === column
                                                                                        )?.score || 0,
                                                                                        getCriterionMaxScore(column)
                                                                                    )
                                                                                }
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    'Pending'
                                                                )}
                                                            </div>
                                                        </td>
                                                    ))}
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium">
                                                            {evaluation.facultySubmitted ? (
                                                                <div>
                                                                    <div className="text-blue-600">Faculty: {totalScoreObj.faculty}</div>
                                                                    {evaluation.reviewerSubmitted && (
                                                                        <div className="text-green-600">Reviewer: {totalScoreObj.reviewer}</div>
                                                                    )}
                                                                    <div className="text-indigo-800 font-bold border-t border-gray-200 mt-1 pt-1">
                                                                        Total: {totalScoreObj.total}/{criteriaColumns.reduce((acc, column) => acc + getCriterionMaxScore(column), 0)}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                'Pending'
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No project data available</p>
                        </div>
                    )}

                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
                        <h3 className="text-lg font-medium text-gray-800 mb-4">Submit Evaluation</h3>

                        <div className="flex flex-col md:flex-row gap-4 mb-4">
                            <button
                                onClick={downloadCurrentExcel}
                                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                                disabled={!evaluation.excelData || evaluation.excelData.length === 0}
                            >
                                <Download className="w-5 h-5 mr-2" />
                                Download Current Excel
                            </button>
                        </div>

                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-100 rounded-md">
                            <p className="text-yellow-800 font-medium">Important:</p>
                            <p className="text-yellow-700">
                                Faculty can only give up to half of the maximum score for each criterion.
                                Reviewer can give the other half. Scores exceeding these limits will be capped.
                            </p>
                        </div>

                        {(canSubmitFaculty || canSubmitReviewer) && (
                            <form onSubmit={handleSubmit} className="mt-4">
                                <div className="mt-2 flex items-center">
                                    <label htmlFor="excel-upload" className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer">
                                        <Upload className="w-5 h-5 mr-2" />
                                        {file ? 'Change File' : 'Upload Completed Excel'}
                                        <input
                                            type="file"
                                            accept=".xlsx"
                                            id="excel-upload"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                    {file && (
                                        <span className="ml-3 text-sm text-gray-500">
                                            {file.name}
                                        </span>
                                    )}
                                </div>

                                {file && (
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition disabled:opacity-70 flex items-center"
                                    >
                                        {submitting ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="h-4 w-4 mr-2" />
                                                Submit Evaluation
                                            </>
                                        )}
                                    </button>
                                )}
                            </form>
                        )}

                        {evaluation.facultySubmitted && (
                            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
                                <p className="text-blue-800 font-medium">Faculty evaluation submitted</p>
                            </div>
                        )}

                        {evaluation.reviewerSubmitted && (
                            <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-md">
                                <p className="text-green-800 font-medium">Reviewer evaluation submitted</p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center">
                        <button
                            onClick={() => navigate(-1)}
                            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition"
                        >
                            Back
                        </button>

                        <button
                            onClick={() => navigate('/evaluations')}
                            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition"
                        >
                            All Evaluations
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExcelEvaluationView;

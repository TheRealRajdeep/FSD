import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ClipboardList, CheckSquare, File, Users, Calendar } from 'lucide-react';
import AuthContext from '../../context/AuthContext';

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
    facultySubmitted: boolean;
    reviewerSubmitted: boolean;
    excelData?: any[];
    createdAt: string;
}

interface ProjectGroup {
    date: string;
    evaluations: Evaluation[];
}

const MultiProjectEvaluations: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [projectGroups, setProjectGroups] = useState<ProjectGroup[]>([]);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEvaluations = async () => {
            try {
                setLoading(true);
                const res = await axios.get('/api/evaluations');

                // Filter only Excel-based evaluations
                // Filter only Excel-based evaluations
                const excelEvaluations = res.data.filter(
                    (evaluation: Evaluation) => evaluation.evaluationType === 'excel-based'
                );

                // Group by date created (as a proxy for upload session)
                const groupedByDate = excelEvaluations.reduce((groups: { [key: string]: Evaluation[] }, evaluation: Evaluation) => {
                    const date = new Date(evaluation.createdAt).toLocaleDateString();
                    if (!groups[date]) {
                        groups[date] = [];
                    }
                    groups[date].push(evaluation);
                    return groups;
                }, {});
                // Convert to array of groups
                const groupArray = Object.keys(groupedByDate).map(date => ({
                    date,
                    evaluations: groupedByDate[date]
                }));

                // Sort by newest first
                groupArray.sort((a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                );

                setProjectGroups(groupArray);
            } catch (error) {
                console.error('Error fetching evaluations:', error);
                toast.error('Failed to load evaluations');
                setLoading(false);
            }
        };

        fetchEvaluations();
    }, []);

    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const getStudentCount = (evaluation: Evaluation) => {
        if (!evaluation.excelData) return '?';
        return evaluation.excelData.length;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center mb-4">
                <File className="h-8 w-8 text-indigo-600 mr-3" />
                <h1 className="text-2xl font-bold text-gray-800">Project Evaluations</h1>
            </div>

            {projectGroups.length > 0 ? (
                projectGroups.map((group, groupIndex) => (
                    <div key={groupIndex} className="bg-white rounded-xl shadow-md p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">
                            Evaluations Created on {group.date}
                        </h2>

                        <div className="space-y-4">
                            {group.evaluations.map(evaluation => (
                                <div
                                    key={evaluation._id}
                                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="flex items-center">
                                                <ClipboardList className="h-5 w-5 text-indigo-600 mr-2" />
                                                <h3 className="font-medium text-gray-800">{evaluation.project.title}</h3>
                                            </div>

                                            <div className="mt-2 flex flex-wrap gap-2">
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Users className="h-4 w-4 mr-1" />
                                                    <span>{evaluation.team.name} ({getStudentCount(evaluation)} students)</span>
                                                </div>

                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Calendar className="h-4 w-4 mr-1" />
                                                    <span>Due: {formatDate(evaluation.dueDate)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium mr-3 ${evaluation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    evaluation.status === 'faculty-evaluated' ? 'bg-blue-100 text-blue-800' :
                                                        evaluation.status === 'reviewer-evaluated' ? 'bg-purple-100 text-purple-800' :
                                                            'bg-green-100 text-green-800'
                                                }`}>
                                                {evaluation.status.replace(/-/g, ' ').toUpperCase()}
                                            </span>

                                            {evaluation.facultySubmitted && user?.role === 'faculty' && (
                                                <CheckSquare className="h-5 w-5 text-green-500 mr-2" />
                                            )}

                                            <button
                                                onClick={() => navigate(`/evaluations/${evaluation._id}`)}
                                                className="bg-indigo-600 text-white px-4 py-1 rounded-md hover:bg-indigo-700 text-sm"
                                            >
                                                {!evaluation.facultySubmitted && user?.role === 'faculty' ? 'Evaluate' :
                                                    !evaluation.reviewerSubmitted && user?.role === 'reviewer' ? 'Review' :
                                                        'View'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            ) : (
                <div className="bg-white rounded-xl shadow-md p-8 text-center">
                    <h3 className="text-xl font-medium text-gray-800 mb-2">No Excel-Based Evaluations</h3>
                    <p className="text-gray-600 mb-6">
                        You haven't created any project evaluations using Excel uploads yet.
                    </p>
                    {user?.role === 'faculty' && (
                        <button
                            onClick={() => navigate('/evaluations/excel-create')}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition"
                        >
                            Create Excel-Based Evaluation
                        </button>
                    )}
                </div>
            )}

            <div className="flex justify-between">
                <button
                    onClick={() => navigate('/evaluations')}
                    className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition"
                >
                    Back to Evaluations
                </button>

                {user?.role === 'faculty' && (
                    <button
                        onClick={() => navigate('/evaluations/excel-create')}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
                    >
                        New Excel Upload
                    </button>
                )}
            </div>
        </div>
    );
};

export default MultiProjectEvaluations;

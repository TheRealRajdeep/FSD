import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { utils, write, read } from 'xlsx';
import { saveAs } from 'file-saver';
import { ClipboardList, BookOpen, Users, Calendar, Check, X, Download, Upload, AlertCircle, Info } from 'lucide-react';
import AuthContext from '../../context/AuthContext';

interface RubricItem {
  _id: string;
  criterion: string;
  description: string;
  maxScore: number;
  facultyScore: {
    value: number | null;
    submittedBy: any;
    submittedAt: string;
    locked: boolean;
  };
  reviewerScore: {
    value: number | null;
    submittedBy: any;
    submittedAt: string;
    locked: boolean;
  };
}

interface Evaluation {
  _id: string;
  project: {
    _id: string;
    title: string;
    description: string;
  };
  team: {
    _id: string;
    name: string;
    members: any[];
    leader?: any;
  };
  evaluationType: string;
  dueDate: string;
  status: string;
  rubricItems: RubricItem[];
  facultySubmitted: boolean;
  reviewerSubmitted: boolean;
  excelData?: any[];
  hasPrefilledScores?: boolean;
}

interface ExcelRow {
  CriterionId: string;
  Criterion: string;
  MaxScore: number;
  Score: number;
}

const EvaluationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useContext(AuthContext);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [scores, setScores] = useState<{ [key: string]: number }>({});
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [evaluationType, setEvaluationType] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvaluation = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/evaluations/${id}`);
        setEvaluation(res.data);
        setEvaluationType(res.data.evaluationType || 'milestone');

        const initialScores: { [key: string]: number } = {};

        const excelData = res.data.excelData;
        const hasPrefilledScores = res.data.hasPrefilledScores;

        res.data.rubricItems.forEach((item: RubricItem) => {
          if (user?.role === 'faculty') {
            if (hasPrefilledScores && excelData && excelData.length > 0) {
              let totalScore = 0;
              let count = 0;

              excelData.forEach((row: Record<string, any>) => {
                if (row[item.criterion] !== undefined &&
                  row[item.criterion] !== null &&
                  row[item.criterion] !== "") {
                  const score: number = parseFloat(row[item.criterion]);
                  if (!isNaN(score)) {
                    const validScore: number = Math.min(Math.max(0, score), item.maxScore);
                    totalScore += validScore;
                    count++;
                  }
                }
              });

              if (count > 0) {
                initialScores[item._id] = Math.round((totalScore / count) * 10) / 10;
              } else {
                initialScores[item._id] = item.facultyScore.value || 0;
              }
            } else {
              initialScores[item._id] = item.facultyScore.value || 0;
            }
          } else if (user?.role === 'reviewer') {
            initialScores[item._id] = item.reviewerScore.value || 0;
          }
        });

        setScores(initialScores);
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
  }, [id, user]);

  const handleScoreChange = (itemId: string, value: number) => {
    const rubricItem = evaluation?.rubricItems.find(item => item._id === itemId);
    if (rubricItem) {
      const validValue = Math.min(Math.max(0, value), rubricItem.maxScore);
      setScores(prev => ({ ...prev, [itemId]: validValue }));
    } else {
      setScores(prev => ({ ...prev, [itemId]: value }));
    }
  };

  const handleSubmit = async () => {
    try {
      const invalidScores: string[] = [];

      evaluation?.rubricItems.forEach(item => {
        const score = scores[item._id];
        if (score > item.maxScore) {
          invalidScores.push(`${item.criterion}: ${score} (max is ${item.maxScore})`);
        }
      });

      if (invalidScores.length > 0) {
        toast.error(`Some scores exceed maximum allowed values: ${invalidScores.join(', ')}`);
        return;
      }

      setSubmitting(true);

      const rubricScores = evaluation?.rubricItems.map(item => ({
        itemId: item._id,
        value: scores[item._id]
      }));

      if (user?.role === 'faculty') {
        await axios.put(`/api/evaluations/${id}/faculty-score`, {
          rubricScores,
          evaluationType: evaluationType
        });
      } else if (user?.role === 'reviewer') {
        await axios.put(`/api/evaluations/${id}/reviewer-score`, {
          rubricScores,
          evaluationType: evaluationType
        });
      }

      toast.success('Evaluation submitted successfully!');
      navigate('/evaluations');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit evaluation');
      setSubmitting(false);
    }
  };

  const handleEvaluationTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setEvaluationType(event.target.value);
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const calculateTotalScore = (type: 'faculty' | 'reviewer') => {
    if (!evaluation) return 0;

    return evaluation.rubricItems.reduce((total, item) => {
      const score = type === 'faculty' ? item.facultyScore.value : item.reviewerScore.value;
      return total + (score || 0);
    }, 0);
  };

  const calculateMaxScore = () => {
    if (!evaluation) return 0;

    return evaluation.rubricItems.reduce((total, item) => {
      return total + item.maxScore;
    }, 0);
  };

  const getExcelScoresPreview = () => {
    if (!evaluation || !evaluation.hasPrefilledScores) {
      return null;
    }

    const criteria = evaluation.rubricItems.map(item => item.criterion);

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Imported Project Scores from Excel
        </h3>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-gray-700 mb-3">
            Project-level scores were imported from your Excel file. These scores will be applied to the entire team's project.
          </p>

          <div className="overflow-x-auto mt-2">
            <table className="min-w-full divide-y divide-gray-200 border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Project</th>
                  {criteria.map(criterion => (
                    <th key={criterion} className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                      {criterion}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr className="text-sm">
                  <td className="px-3 py-2 whitespace-nowrap font-medium">
                    {evaluation.project.title}
                  </td>
                  {criteria.map(criterion => {
                    const rubricItem = evaluation.rubricItems.find(item => item.criterion === criterion);
                    return (
                      <td key={criterion} className="px-3 py-2 whitespace-nowrap">
                        {rubricItem && rubricItem.facultyScore.value !== null ? (
                          <span className={rubricItem.facultyScore.value > 5 ? 'text-red-600 font-bold' : ''}>
                            {rubricItem.facultyScore.value}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-gray-600 flex items-center">
            <Info className="h-4 w-4 mr-2 text-blue-500" />
            Scores are applied at the project level for the entire team
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <h3 className="text-xl font-medium text-gray-800 mb-2">Evaluation Not Found</h3>
        <p className="text-gray-600 mb-6">The evaluation you're looking for doesn't exist or you don't have permission to view it.</p>
        <button
          onClick={() => navigate('/evaluations')}
          className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition"
        >
          Back to Evaluations
        </button>
      </div>
    );
  }

  const canSubmitFaculty = user?.role === 'faculty' && !evaluation.facultySubmitted;
  const canSubmitReviewer = user?.role === 'reviewer' && !evaluation.reviewerSubmitted;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div className="flex items-center mb-4 md:mb-0">
              <ClipboardList className="h-8 w-8 text-indigo-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {evaluation.evaluationType.charAt(0).toUpperCase() + evaluation.evaluationType.slice(1)} Evaluation
                </h1>
                <p className="text-gray-600">{evaluation.project.title}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {evaluation.evaluationType === 'excel-based' && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Excel-Based
                </span>
              )}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${evaluation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                evaluation.status === 'faculty-evaluated' ? 'bg-blue-100 text-blue-800' :
                  evaluation.status === 'reviewer-evaluated' ? 'bg-purple-100 text-purple-800' :
                    'bg-green-100 text-green-800'
                }`}>
                {evaluation.status.replace('-', ' ').toUpperCase()}
              </span>
            </div>
          </div>

          {(canSubmitFaculty || canSubmitReviewer) && (
            <div className="mb-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <label htmlFor="evaluationType" className="block text-sm font-medium text-gray-700 mb-2">
                  Evaluation Type:
                </label>
                <div className="flex items-center space-x-4">
                  <select
                    id="evaluationType"
                    value={evaluationType}
                    onChange={handleEvaluationTypeChange}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="milestone">Milestone Evaluation</option>
                    <option value="final">Final Evaluation</option>
                    {evaluation.evaluationType === 'excel-based' && (
                      <option value="excel-based">Excel-Based Evaluation</option>
                    )}
                  </select>

                  {evaluationType !== evaluation.evaluationType && (
                    <span className="text-amber-600 text-sm flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Changed from original type
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {!canSubmitFaculty && !canSubmitReviewer && (
            <div className="mb-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-700">
                  Evaluation Type:
                  <span className="ml-2 text-gray-900 capitalize">
                    {evaluation.evaluationType.replace(/-/g, ' ')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {evaluation.hasPrefilledScores && getExcelScoresPreview()}

          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Evaluation Rubric</h3>

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Criterion
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Max Score
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Faculty Score
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reviewer Score
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {evaluation.rubricItems.map(item => (
                    <tr key={item._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.criterion}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">{item.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.maxScore}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.facultyScore.locked ? (
                          <div className="text-sm font-medium text-gray-900">
                            {item.facultyScore.value} / {item.maxScore}
                          </div>
                        ) : canSubmitFaculty ? (
                          <div className="flex items-center">
                            <input
                              type="number"
                              min="0"
                              max={item.maxScore}
                              value={scores[item._id]}
                              onChange={(e) => handleScoreChange(item._id, parseInt(e.target.value))}
                              className="w-16 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <span className="ml-2 text-xs text-gray-500">/ {item.maxScore}</span>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">Not submitted</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.reviewerScore.locked ? (
                          <div className="text-sm font-medium text-gray-900">
                            {item.reviewerScore.value} / {item.maxScore}
                          </div>
                        ) : canSubmitReviewer ? (
                          <div className="flex items-center">
                            <input
                              type="number"
                              min="0"
                              max={item.maxScore}
                              value={scores[item._id]}
                              onChange={(e) => handleScoreChange(item._id, parseInt(e.target.value))}
                              className="w-16 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <span className="ml-2 text-xs text-gray-500">/ {item.maxScore}</span>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">Not submitted</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-gray-900">Total Score:</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{calculateMaxScore()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {evaluation.facultySubmitted ? `${calculateTotalScore('faculty')} / ${calculateMaxScore()}` : 'Pending'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {evaluation.reviewerSubmitted ? `${calculateTotalScore('reviewer')} / ${calculateMaxScore()}` : 'Pending'}
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={() => navigate('/evaluations')}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition"
            >
              Back to Evaluations
            </button>

            {(canSubmitFaculty || canSubmitReviewer) && (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition disabled:opacity-70 flex items-center"
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationDetail;
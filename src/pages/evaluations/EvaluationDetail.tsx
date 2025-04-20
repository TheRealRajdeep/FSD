import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { utils, writeFile } from 'xlsx';
import { saveAs } from 'file-saver';
import { ClipboardList, BookOpen, Users, Calendar, Check, X, Download, Upload } from 'lucide-react';
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
    comments: string;
    locked: boolean;
  };
  reviewerScore: {
    value: number | null;
    submittedBy: any;
    submittedAt: string;
    comments: string;
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
  };
  evaluationType: string;
  dueDate: string;
  status: string;
  rubricItems: RubricItem[];
  facultySubmitted: boolean;
  reviewerSubmitted: boolean;
}

interface ExcelRow {
  CriterionId: string;
  Criterion: string;
  MaxScore: number;
  Score: number;
  Comments: string;
}

const EvaluationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useContext(AuthContext);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [scores, setScores] = useState<{ [key: string]: number }>({});
  const [comments, setComments] = useState<{ [key: string]: string }>({});
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvaluation = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/evaluations/${id}`);
        setEvaluation(res.data);

        // Initialize scores and comments
        const initialScores: { [key: string]: number } = {};
        const initialComments: { [key: string]: string } = {};

        res.data.rubricItems.forEach((item: RubricItem) => {
          if (user?.role === 'faculty') {
            initialScores[item._id] = item.facultyScore.value || 0;
            initialComments[item._id] = item.facultyScore.comments || '';
          } else if (user?.role === 'reviewer') {
            initialScores[item._id] = item.reviewerScore.value || 0;
            initialComments[item._id] = item.reviewerScore.comments || '';
          }
        });

        setScores(initialScores);
        setComments(initialComments);
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
    setScores(prev => ({ ...prev, [itemId]: value }));
  };

  const handleCommentChange = (itemId: string, value: string) => {
    setComments(prev => ({ ...prev, [itemId]: value }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      const rubricScores = evaluation?.rubricItems.map(item => ({
        itemId: item._id,
        value: scores[item._id],
        comments: comments[item._id]
      }));

      if (user?.role === 'faculty') {
        await axios.put(`/api/evaluations/${id}/faculty-score`, { rubricScores });
      } else if (user?.role === 'reviewer') {
        await axios.put(`/api/evaluations/${id}/reviewer-score`, { rubricScores });
      }

      toast.success('Evaluation submitted successfully!');
      navigate('/evaluations');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit evaluation');
      setSubmitting(false);
    }
  };

  const downloadExcelTemplate = () => {
    if (!evaluation) return;

    const rows: ExcelRow[] = evaluation.rubricItems.map(item => ({
      CriterionId: item._id,
      Criterion: item.criterion,
      MaxScore: item.maxScore,
      Score: user?.role === 'faculty' ? (item.facultyScore.value || 0) : (item.reviewerScore.value || 0),
      Comments: user?.role === 'faculty' ? (item.facultyScore.comments || '') : (item.reviewerScore.comments || '')
    }));

    const ws = utils.json_to_sheet(rows);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Evaluation');

    const excelBuffer = writeFile(wb, { bookType: 'xlsx', type: 'array' });
    const fileName = `evaluation-${evaluation._id}-${user?.role}.xlsx`;

    saveAs(new Blob([excelBuffer]), fileName);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = utils.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: ExcelRow[] = utils.sheet_to_json(worksheet);

        const rubricScores = rows.map(row => ({
          itemId: row.CriterionId,
          value: row.Score,
          comments: row.Comments
        }));

        setSubmitting(true);
        if (user?.role === 'faculty') {
          await axios.put(`/api/evaluations/${id}/faculty-score`, { rubricScores });
        } else if (user?.role === 'reviewer') {
          await axios.put(`/api/evaluations/${id}/reviewer-score`, { rubricScores });
        }

        toast.success('Evaluation scores uploaded successfully!');
        navigate('/evaluations');
      } catch (error) {
        console.error('Error processing Excel file:', error);
        toast.error('Failed to process Excel file');
      }
    };
    reader.readAsArrayBuffer(file);
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
                <BookOpen className="h-5 w-5 text-indigo-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-800">Project</h3>
              </div>
              <p className="font-medium mb-2">{evaluation.project.title}</p>
              <p className="text-gray-600 text-sm line-clamp-3">{evaluation.project.description}</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Users className="h-5 w-5 text-indigo-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-800">Team</h3>
              </div>
              <p className="font-medium mb-2">{evaluation.team.name}</p>
              <p className="text-gray-600 text-sm">{evaluation.team.members.length} Members</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Calendar className="h-5 w-5 text-indigo-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-800">Due Date</h3>
              </div>
              <p className="font-medium">{formatDate(evaluation.dueDate)}</p>
              <p className="text-gray-600 text-sm mt-2">
                {new Date(evaluation.dueDate) < new Date() ? 'Overdue' : 'Upcoming'}
              </p>
            </div>
          </div>

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
                            {item.facultyScore.comments && (
                              <div className="text-xs text-gray-500 mt-1">
                                Comment: {item.facultyScore.comments}
                              </div>
                            )}
                          </div>
                        ) : canSubmitFaculty ? (
                          <div className="space-y-2">
                            <input
                              type="number"
                              min="0"
                              max={item.maxScore}
                              value={scores[item._id]}
                              onChange={(e) => handleScoreChange(item._id, parseInt(e.target.value))}
                              className="w-16 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <div>
                              <textarea
                                placeholder="Add comments..."
                                value={comments[item._id]}
                                onChange={(e) => handleCommentChange(item._id, e.target.value)}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                rows={2}
                              ></textarea>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">Not submitted</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.reviewerScore.locked ? (
                          <div className="text-sm font-medium text-gray-900">
                            {item.reviewerScore.value} / {item.maxScore}
                            {item.reviewerScore.comments && (
                              <div className="text-xs text-gray-500 mt-1">
                                Comment: {item.reviewerScore.comments}
                              </div>
                            )}
                          </div>
                        ) : canSubmitReviewer ? (
                          <div className="space-y-2">
                            <input
                              type="number"
                              min="0"
                              max={item.maxScore}
                              value={scores[item._id]}
                              onChange={(e) => handleScoreChange(item._id, parseInt(e.target.value))}
                              className="w-16 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <div>
                              <textarea
                                placeholder="Add comments..."
                                value={comments[item._id]}
                                onChange={(e) => handleCommentChange(item._id, e.target.value)}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                rows={2}
                              ></textarea>
                            </div>
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

      {/* Excel-based Evaluation - Only visible to faculty */}
      {user?.role === 'faculty' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">Excel-based Evaluation</h3>

          <div className="flex flex-col md:flex-row gap-4">
            <button
              onClick={downloadExcelTemplate}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Download className="w-5 h-5 mr-2" />
              Download Excel Template
            </button>

            <div className="relative">
              <input
                type="file"
                accept=".xlsx"
                onChange={handleFileUpload}
                className="hidden"
                id="excel-upload"
              />
              <label
                htmlFor="excel-upload"
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload Filled Template
              </label>
            </div>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            Note: Download the template, fill in your scores and comments, then upload the completed file.
            As faculty, you can only modify faculty scores.
          </p>
        </div>
      )}
    </div>
  );
};

export default EvaluationDetail;
import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ClipboardList, Search, Plus, Filter, File } from 'lucide-react';
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
}

const EvaluationList: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [filteredEvaluations, setFilteredEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/evaluations');
        setEvaluations(res.data);
        setFilteredEvaluations(res.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching evaluations:', error);
        toast.error('Failed to load evaluations');
        setLoading(false);
      }
    };

    fetchEvaluations();
  }, []);

  useEffect(() => {
    // Apply filters
    let filtered = evaluations;

    // Search filter
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(evaluation =>
        evaluation.project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evaluation.team.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(evaluation => evaluation.status === statusFilter);
    }

    // Role-specific filters
    if (user?.role === 'faculty') {
      if (statusFilter === 'pending-faculty') {
        filtered = filtered.filter(evaluation => !evaluation.facultySubmitted);
      }
    } else if (user?.role === 'reviewer') {
      if (statusFilter === 'pending-reviewer') {
        filtered = filtered.filter(evaluation =>
          !evaluation.reviewerSubmitted &&
          (evaluation.status === 'faculty-evaluated' || evaluation.status === 'pending')
        );
      }
    }

    setFilteredEvaluations(filtered);
  }, [searchTerm, statusFilter, evaluations, user]);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center mb-4 md:mb-0">
          <ClipboardList className="h-8 w-8 text-indigo-600 mr-3" />
          <h1 className="text-2xl font-bold text-gray-800">Evaluations</h1>
        </div>

        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search evaluations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="faculty-evaluated">Faculty Evaluated</option>
              <option value="reviewer-evaluated">Reviewer Evaluated</option>
              <option value="completed">Completed</option>
              {user?.role === 'faculty' && (
                <option value="pending-faculty">Pending Faculty Review</option>
              )}
              {user?.role === 'reviewer' && (
                <option value="pending-reviewer">Pending Reviewer Review</option>
              )}
            </select>
            <Filter className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>

          {user?.role === 'faculty' && (
            <div className="flex space-x-4">
              <Link
                to="/evaluations/create"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition inline-flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Evaluation
              </Link>

              <Link
                to="/evaluations/excel-create"
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition inline-flex items-center"
              >
                <File className="h-5 w-5 mr-2" />
                Excel-Based Evaluation
              </Link>

              <Link
                to="/evaluations/excel-projects"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition inline-flex items-center"
              >
                <ClipboardList className="h-5 w-5 mr-2" />
                Multi-Project Evaluations
              </Link>
            </div>
          )}
        </div>
      </div>

      {filteredEvaluations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <h3 className="text-xl font-medium text-gray-800 mb-2">No Evaluations Found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter !== 'all'
              ? 'No evaluations match your search criteria.'
              : 'There are no evaluations available at the moment.'}
          </p>
          {user?.role === 'faculty' && (
            <Link
              to="/evaluations/create"
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition inline-flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create a New Evaluation
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEvaluations.map(evaluation => (
                  <tr key={evaluation._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{evaluation.project.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{evaluation.team.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">
                        {evaluation.evaluationType.replace('-', ' ')}
                        {evaluation.evaluationType === 'excel-based' && (
                          <span className="inline-flex items-center ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Excel
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(evaluation.dueDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${evaluation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        evaluation.status === 'faculty-evaluated' ? 'bg-blue-100 text-blue-800' :
                          evaluation.status === 'reviewer-evaluated' ? 'bg-purple-100 text-purple-800' :
                            evaluation.status === 'completed' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                        }`}>
                        {evaluation.status.replace(/-/g, ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        to={`/evaluations/${evaluation._id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        {user?.role === 'faculty' && !evaluation.facultySubmitted ? 'Evaluate' :
                          user?.role === 'reviewer' && !evaluation.reviewerSubmitted ? 'Review' :
                            'View'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvaluationList;
import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Users, BookOpen, ClipboardList, Bell, Calendar, ChevronRight } from 'lucide-react';
import AuthContext from '../context/AuthContext';

interface Team {
  _id: string;
  name: string;
  leader: any;
  members: any[];
  project: any;
}

interface Project {
  _id: string;
  title: string;
  status: string;
}

interface Evaluation {
  _id: string;
  evaluationType: string;
  dueDate: string;
  status: string;
}

const Dashboard: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [team, setTeam] = useState<Team | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // For students, fetch their team and project evaluations
        if (user?.role === 'student') {
          try {
            // Get current user with latest team information and project data
            const userResponse = await axios.get('/api/auth/me');
            const currentUser = userResponse.data;

            if (currentUser.team) {
              setTeam(currentUser.team);

              // If the team has a project, set it directly from the populated data
              if (currentUser.team.project) {
                setProject(currentUser.team.project);
              }

              // Get evaluations for this team
              try {
                const evalRes = await axios.get(`/api/evaluations/team/${currentUser.team._id}`);
                setEvaluations(evalRes.data);
              } catch (evalError) {
                console.error('Error fetching evaluations:', evalError);
              }
            }
          } catch (error) {
            console.error('Error fetching student data:', error);
          }
        }

        // For faculty and reviewers, fetch pending evaluations
        if (['faculty', 'reviewer'].includes(user?.role || '')) {
          try {
            const evalRes = await axios.get('/api/evaluations');
            let filteredEvals = evalRes.data;

            if (user?.role === 'faculty') {
              filteredEvals = filteredEvals.filter((evaluation: any) =>
                !evaluation.facultySubmitted || evaluation.status === 'pending'
              );
            } else if (user?.role === 'reviewer') {
              filteredEvals = filteredEvals.filter((evaluation: any) =>
                !evaluation.reviewerSubmitted || evaluation.status === 'faculty-evaluated'
              );
            }

            setEvaluations(filteredEvals.slice(0, 5));
          } catch (evalError) {
            console.error('Error fetching evaluations:', evalError);
            toast.error('Failed to load evaluations');
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Welcome, {user?.name}!
        </h1>
        <p className="text-gray-600">
          {user?.role === 'student' && 'Access your team, project, and evaluations.'}
          {user?.role === 'faculty' && 'Manage and evaluate student projects.'}
          {user?.role === 'reviewer' && 'Review and provide feedback on student projects.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Student Dashboard */}
        {user?.role === 'student' && (
          <>
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center mb-4">
                <Users className="text-indigo-600 mr-2" size={24} />
                <h2 className="text-xl font-semibold">Your Team</h2>
              </div>

              {team ? (
                <div>
                  <p className="font-medium text-lg mb-2">{team.name}</p>
                  <p className="text-gray-600 mb-2">{team.members ? team.members.length : 0} Members</p>
                  <Link
                    to={`/teams/${team._id}`}
                    className="text-indigo-600 hover:text-indigo-800 flex items-center mt-4"
                  >
                    View Team Details
                    <ChevronRight size={16} className="ml-1" />
                  </Link>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 mb-4">You are not part of any team yet.</p>
                  <div className="flex space-x-4">
                    <Link
                      to="/teams/create"
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                    >
                      Create Team
                    </Link>
                    <Link
                      to="/teams"
                      className="border border-indigo-600 text-indigo-600 px-4 py-2 rounded-md hover:bg-indigo-50 transition"
                    >
                      Join Team
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center mb-4">
                <BookOpen className="text-indigo-600 mr-2" size={24} />
                <h2 className="text-xl font-semibold">Your Project</h2>
              </div>

              {project ? (
                <div>
                  <p className="font-medium text-lg mb-2">{project.title}</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${project.status === 'planning' ? 'bg-blue-100 text-blue-800' :
                    project.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                      project.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                    }`}>
                    {project.status.replace('-', ' ').toUpperCase()}
                  </span>
                  <Link
                    to={`/projects/${project._id}`}
                    className="text-indigo-600 hover:text-indigo-800 flex items-center mt-4"
                  >
                    View Project Details
                    <ChevronRight size={16} className="ml-1" />
                  </Link>
                </div>
              ) : team ? (
                <div>
                  <p className="text-gray-600 mb-4">Your team doesn't have a project yet.</p>
                  {team.leader && team.leader._id === user?._id && (
                    <Link
                      to="/projects/create"
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                    >
                      Create Project
                    </Link>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">Join a team first to create or view projects.</p>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center mb-4">
                <ClipboardList className="text-indigo-600 mr-2" size={24} />
                <h2 className="text-xl font-semibold">Evaluations</h2>
              </div>

              {evaluations.length > 0 ? (
                <div>
                  <ul className="space-y-3">
                    {evaluations.map(evaluation => (
                      <li key={evaluation._id} className="border-b pb-2">
                        <p className="font-medium">
                          {evaluation.evaluationType.charAt(0).toUpperCase() + evaluation.evaluationType.slice(1)} Evaluation
                        </p>
                        <div className="flex justify-between items-center mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${evaluation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            evaluation.status === 'completed' ? 'bg-green-100 text-green-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                            {evaluation.status.replace('-', ' ').toUpperCase()}
                          </span>
                          <Link
                            to={`/evaluations/${evaluation._id}`}
                            className="text-indigo-600 hover:text-indigo-800 text-sm"
                          >
                            View
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-gray-600">No evaluations available yet.</p>
              )}
            </div>
          </>
        )}

        {/* Faculty Dashboard */}
        {user?.role === 'faculty' && (
          <>
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center mb-4">
                <ClipboardList className="text-indigo-600 mr-2" size={24} />
                <h2 className="text-xl font-semibold">Pending Evaluations</h2>
              </div>

              {evaluations.length > 0 ? (
                <div>
                  <ul className="space-y-3">
                    {evaluations.map(evaluation => (
                      <li key={evaluation._id} className="border-b pb-2">
                        <p className="font-medium">
                          {evaluation.evaluationType.charAt(0).toUpperCase() + evaluation.evaluationType.slice(1)} Evaluation
                        </p>
                        <div className="flex justify-between items-center mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${evaluation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                            }`}>
                            {evaluation.status.replace('-', ' ').toUpperCase()}
                          </span>
                          <Link
                            to={`/evaluations/${evaluation._id}`}
                            className="text-indigo-600 hover:text-indigo-800 text-sm"
                          >
                            Evaluate
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to="/evaluations"
                    className="text-indigo-600 hover:text-indigo-800 flex items-center mt-4"
                  >
                    View All Evaluations
                    <ChevronRight size={16} className="ml-1" />
                  </Link>
                </div>
              ) : (
                <p className="text-gray-600">No pending evaluations.</p>
              )}

              <Link
                to="/evaluations/create"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition mt-4 inline-block"
              >
                Create New Evaluation
              </Link>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center mb-4">
                <Users className="text-indigo-600 mr-2" size={24} />
                <h2 className="text-xl font-semibold">Teams</h2>
              </div>

              <Link
                to="/teams"
                className="text-indigo-600 hover:text-indigo-800 flex items-center"
              >
                View All Teams
                <ChevronRight size={16} className="ml-1" />
              </Link>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center mb-4">
                <Bell className="text-indigo-600 mr-2" size={24} />
                <h2 className="text-xl font-semibold">Notifications</h2>
              </div>

              <p className="text-gray-600">No new notifications.</p>
            </div>
          </>
        )}

        {/* Reviewer Dashboard */}
        {user?.role === 'reviewer' && (
          <>
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center mb-4">
                <ClipboardList className="text-indigo-600 mr-2" size={24} />
                <h2 className="text-xl font-semibold">Pending Reviews</h2>
              </div>

              {evaluations.length > 0 ? (
                <div>
                  <ul className="space-y-3">
                    {evaluations.map(evaluation => (
                      <li key={evaluation._id} className="border-b pb-2">
                        <p className="font-medium">
                          {evaluation.evaluationType.charAt(0).toUpperCase() + evaluation.evaluationType.slice(1)} Evaluation
                        </p>
                        <div className="flex justify-between items-center mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${evaluation.status === 'faculty-evaluated' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                            }`}>
                            {evaluation.status.replace('-', ' ').toUpperCase()}
                          </span>
                          <Link
                            to={`/evaluations/${evaluation._id}`}
                            className="text-indigo-600 hover:text-indigo-800 text-sm"
                          >
                            Review
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to="/evaluations"
                    className="text-indigo-600 hover:text-indigo-800 flex items-center mt-4"
                  >
                    View All Evaluations
                    <ChevronRight size={16} className="ml-1" />
                  </Link>
                </div>
              ) : (
                <p className="text-gray-600">No pending reviews.</p>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center mb-4">
                <BookOpen className="text-indigo-600 mr-2" size={24} />
                <h2 className="text-xl font-semibold">Projects</h2>
              </div>

              <Link
                to="/teams"
                className="text-indigo-600 hover:text-indigo-800 flex items-center"
              >
                View All Projects
                <ChevronRight size={16} className="ml-1" />
              </Link>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center mb-4">
                <Calendar className="text-indigo-600 mr-2" size={24} />
                <h2 className="text-xl font-semibold">Upcoming Deadlines</h2>
              </div>

              <p className="text-gray-600">No upcoming deadlines.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
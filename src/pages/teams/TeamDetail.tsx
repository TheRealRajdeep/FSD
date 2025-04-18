import React, { useContext, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Users, User, BookOpen, LogOut, Settings, Plus } from 'lucide-react';
import AuthContext from '../../context/AuthContext';

interface TeamMember {
  _id: string;
  name: string;
  sapId: string;
  email: string;
}

interface TeamProject {
  _id: string;
  title: string;
  description: string;
  status: string;
}

interface Team {
  _id: string;
  name: string;
  description: string;
  members: TeamMember[];
  leader: TeamMember;
  project: TeamProject | null;
  isOpen: boolean;
  maxMembers: number;
}

const TeamDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useContext(AuthContext);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/teams/${id}`);
        setTeam(res.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching team:', error);
        toast.error('Failed to load team details');
        setLoading(false);
      }
    };

    if (id) {
      fetchTeam();
    }
  }, [id]);

  const handleLeaveTeam = async () => {
    if (!window.confirm('Are you sure you want to leave this team?')) {
      return;
    }

    try {
      setLeaving(true);
      await axios.post(`/api/teams/${id}/leave`);
      toast.success('Successfully left the team');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to leave team');
      setLeaving(false);
    }
  };

  const isTeamMember = team?.members.some(member => member._id === user?._id);
  const isTeamLeader = team?.leader._id === user?._id;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <h3 className="text-xl font-medium text-gray-800 mb-2">Team Not Found</h3>
        <p className="text-gray-600 mb-6">The team you're looking for doesn't exist or you don't have permission to view it.</p>
        <Link
          to="/teams"
          className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition"
        >
          Back to Teams
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div className="flex items-center mb-4 md:mb-0">
              <Users className="h-8 w-8 text-indigo-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-800">{team.name}</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                team.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {team.isOpen ? 'Open for Members' : 'Closed'}
              </span>
              
              {isTeamLeader && (
                <Link
                  to={`/teams/${team._id}/edit`}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-200 transition flex items-center"
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Edit Team
                </Link>
              )}
              
              {isTeamMember && !isTeamLeader && (
                <button
                  onClick={handleLeaveTeam}
                  disabled={leaving}
                  className="bg-red-100 text-red-700 px-3 py-1 rounded-md hover:bg-red-200 transition flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  {leaving ? 'Leaving...' : 'Leave Team'}
                </button>
              )}
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Description</h3>
            <p className="text-gray-700">{team.description}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
                <User className="h-5 w-5 text-indigo-600 mr-2" />
                Team Members ({team.members.length}/{team.maxMembers})
              </h3>
              
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <ul className="divide-y divide-gray-200">
                  {team.members.map(member => (
                    <li key={member._id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">{member.name}</p>
                          <p className="text-sm text-gray-600">{member.sapId}</p>
                        </div>
                        {team.leader._id === member._id && (
                          <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-medium">
                            Team Leader
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
                <BookOpen className="h-5 w-5 text-indigo-600 mr-2" />
                Project
              </h3>
              
              {team.project ? (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-lg mb-2">{team.project.title}</h4>
                  <p className="text-gray-700 mb-3">{team.project.description.substring(0, 150)}...</p>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      team.project.status === 'planning' ? 'bg-blue-100 text-blue-800' :
                      team.project.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                      team.project.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {team.project.status.replace('-', ' ').toUpperCase()}
                    </span>
                    <Link
                      to={`/projects/${team.project._id}`}
                      className="text-indigo-600 hover:text-indigo-800 transition"
                    >
                      View Project
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                  <p className="text-gray-600 mb-4">No project created yet.</p>
                  {isTeamLeader && (
                    <Link
                      to="/projects/create"
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition inline-flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Project
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamDetail;
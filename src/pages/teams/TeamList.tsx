import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Users, Search, UserPlus, Info } from 'lucide-react';
import AuthContext from '../../context/AuthContext';

interface Team {
  _id: string;
  name: string;
  description: string;
  members: any[];
  leader: any;
  project: any;
  isOpen: boolean;
  maxMembers: number;
}

const TeamList: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/teams');
        setTeams(res.data);
        setFilteredTeams(res.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching teams:', error);
        toast.error('Failed to load teams');
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredTeams(teams);
    } else {
      const filtered = teams.filter(team => 
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTeams(filtered);
    }
  }, [searchTerm, teams]);

  const handleJoinTeam = async (teamId: string) => {
    try {
      setJoining(teamId);
      await axios.post(`/api/teams/${teamId}/join`);
      toast.success('Successfully joined the team!');
      // Redirect to dashboard or refresh the page
      window.location.href = '/dashboard';
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to join team');
      setJoining(null);
    }
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
          <Users className="h-8 w-8 text-indigo-600 mr-3" />
          <h1 className="text-2xl font-bold text-gray-800">Teams</h1>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          
          {user?.role === 'student' && !user?.team && (
            <Link
              to="/teams/create"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition flex items-center justify-center"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Create Team
            </Link>
          )}
        </div>
      </div>
      
      {filteredTeams.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-800 mb-2">No Teams Found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm ? 'No teams match your search criteria.' : 'There are no teams available at the moment.'}
          </p>
          {user?.role === 'student' && !user?.team && (
            <Link
              to="/teams/create"
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition inline-flex items-center"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Create a New Team
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map(team => (
            <div key={team._id} className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-2">{team.name}</h2>
                <p className="text-gray-600 mb-4 line-clamp-2">{team.description}</p>
                
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-gray-500 mr-1" />
                    <span className="text-gray-700">
                      {team.members.length} / {team.maxMembers} members
                    </span>
                  </div>
                  
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    team.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {team.isOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <Link
                    to={`/teams/${team._id}`}
                    className="text-indigo-600 hover:text-indigo-800 transition"
                  >
                    View Details
                  </Link>
                  
                  {user?.role === 'student' && !user?.team && team.isOpen && team.members.length < team.maxMembers && (
                    <button
                      onClick={() => handleJoinTeam(team._id)}
                      disabled={joining === team._id}
                      className="bg-indigo-600 text-white px-4 py-1 rounded-md hover:bg-indigo-700 transition disabled:opacity-70"
                    >
                      {joining === team._id ? 'Joining...' : 'Join Team'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamList;
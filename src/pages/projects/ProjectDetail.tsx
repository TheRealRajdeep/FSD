import React, { useContext, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BookOpen, Users, Calendar, FileText, Upload, Edit, Clock } from 'lucide-react';
import AuthContext from '../../context/AuthContext';

interface TeamMember {
  _id: string;
  name: string;
  sapId: string;
  email: string;
}

interface Team {
  _id: string;
  name: string;
  members: TeamMember[];
  leader: TeamMember;
}

interface Document {
  _id: string;
  title: string;
  fileUrl: string;
  uploadedAt: string;
}

interface Project {
  _id: string;
  title: string;
  description: string;
  team: Team;
  startDate: string;
  endDate: string;
  status: string;
  documents: Document[];
}

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useContext(AuthContext);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/projects/${id}`);
        setProject(res.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching project:', error);
        toast.error('Failed to load project details');
        setLoading(false);
      }
    };

    if (id) {
      fetchProject();
    }
  }, [id]);

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!documentTitle || !documentUrl) {
      toast.error('Please provide both title and URL for the document');
      return;
    }
    
    try {
      setUploading(true);
      await axios.post(`/api/projects/${id}/document`, {
        title: documentTitle,
        fileUrl: documentUrl
      });
      
      // Refresh project data
      const res = await axios.get(`/api/projects/${id}`);
      setProject(res.data);
      
      // Reset form
      setDocumentTitle('');
      setDocumentUrl('');
      
      toast.success('Document added successfully');
      setUploading(false);
    } catch (error) {
      console.error('Error adding document:', error);
      toast.error('Failed to add document');
      setUploading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const isTeamMember = project?.team.members.some(member => member._id === user?._id);
  const isTeamLeader = project?.team.leader._id === user?._id;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <h3 className="text-xl font-medium text-gray-800 mb-2">Project Not Found</h3>
        <p className="text-gray-600 mb-6">The project you're looking for doesn't exist or you don't have permission to view it.</p>
        <Link
          to="/dashboard"
          className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition"
        >
          Back to Dashboard
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
              <BookOpen className="h-8 w-8 text-indigo-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-800">{project.title}</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                project.status === 'planning' ? 'bg-blue-100 text-blue-800' :
                project.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                project.status === 'completed' ? 'bg-green-100 text-green-800' :
                'bg-purple-100 text-purple-800'
              }`}>
                {project.status.replace('-', ' ').toUpperCase()}
              </span>
              
              {isTeamLeader && (
                <Link
                  to={`/projects/${project._id}/edit`}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-200 transition flex items-center"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit Project
                </Link>
              )}
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-line">{project.description}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Calendar className="h-5 w-5 text-indigo-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-800">Timeline</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Start Date:</span>
                  <span className="font-medium">{formatDate(project.startDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">End Date:</span>
                  <span className="font-medium">{formatDate(project.endDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">
                    {Math.ceil((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Users className="h-5 w-5 text-indigo-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-800">Team</h3>
              </div>
              <p className="font-medium mb-2">{project.team.name}</p>
              <p className="text-gray-600 mb-2">{project.team.members.length} Members</p>
              <Link 
                to={`/teams/${project.team._id}`}
                className="text-indigo-600 hover:text-indigo-800 transition"
              >
                View Team
              </Link>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Clock className="h-5 w-5 text-indigo-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-800">Progress</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium capitalize">{project.status.replace('-', ' ')}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-indigo-600 h-2.5 rounded-full" 
                    style={{ 
                      width: project.status === 'planning' ? '25%' : 
                             project.status === 'in-progress' ? '50%' : 
                             project.status === 'completed' ? '75%' : '100%' 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-800 flex items-center">
                <FileText className="h-5 w-5 text-indigo-600 mr-2" />
                Project Documents
              </h3>
            </div>
            
            {project.documents.length > 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <ul className="divide-y divide-gray-200">
                  {project.documents.map((doc, index) => (
                    <li key={index} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">{doc.title}</p>
                          <p className="text-sm text-gray-600">
                            Uploaded on {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <a 
                          href={doc.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 transition"
                        >
                          View Document
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-gray-600 mb-4">No documents uploaded yet.</p>
            )}
            
            {isTeamMember && (
              <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                  <Upload className="h-4 w-4 text-indigo-600 mr-2" />
                  Add Document
                </h4>
                
                <form onSubmit={handleAddDocument} className="space-y-4">
                  <div>
                    <label htmlFor="documentTitle" className="block text-sm font-medium text-gray-700 mb-1">
                      Document Title
                    </label>
                    <input
                      id="documentTitle"
                      type="text"
                      value={documentTitle}
                      onChange={(e) => setDocumentTitle(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter document title"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="documentUrl" className="block text-sm font-medium text-gray-700 mb-1">
                      Document URL
                    </label>
                    <input
                      id="documentUrl"
                      type="url"
                      value={documentUrl}
                      onChange={(e) => setDocumentUrl(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter document URL"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Please upload your document to a file sharing service and paste the link here.
                    </p>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={uploading}
                    className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition disabled:opacity-70"
                  >
                    {uploading ? 'Adding...' : 'Add Document'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
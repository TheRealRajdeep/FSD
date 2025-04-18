import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import axios from 'axios';
import { BookOpen } from 'lucide-react';
import AuthContext from '../../context/AuthContext';

interface ProjectFormData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
}

const ProjectCreate: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<ProjectFormData>();
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const onSubmit = async (data: ProjectFormData) => {
    try {
      setLoading(true);
      await axios.post('/api/projects', data);
      toast.success('Project created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create project');
      setLoading(false);
    }
  };

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-md overflow-hidden p-8">
        <div className="flex items-center mb-6">
          <BookOpen className="h-8 w-8 text-indigo-600 mr-3" />
          <h1 className="text-2xl font-bold text-gray-800">Create a New Project</h1>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Project Title
            </label>
            <input
              id="title"
              type="text"
              {...register('title', { required: 'Project title is required' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter project title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              rows={6}
              {...register('description', { 
                required: 'Description is required',
                minLength: {
                  value: 20,
                  message: 'Description should be at least 20 characters'
                }
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Provide a detailed description of your project"
            ></textarea>
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                id="startDate"
                type="date"
                min={today}
                {...register('startDate', { required: 'Start date is required' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                id="endDate"
                type="date"
                min={today}
                {...register('endDate', { required: 'End date is required' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition disabled:opacity-70"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="border border-gray-300 text-gray-700 py-2 px-6 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
            >
              Cancel
            </button>
          </div>
        </form>
        
        <div className="mt-8 p-4 bg-blue-50 rounded-md">
          <h3 className="text-lg font-medium text-blue-800 mb-2">Important Notes:</h3>
          <ul className="list-disc list-inside text-blue-700 space-y-1">
            <li>Your project will be associated with your current team.</li>
            <li>All team members will have access to the project.</li>
            <li>You can upload documents and track progress after creation.</li>
            <li>Faculty and reviewers will evaluate your project based on established rubrics.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProjectCreate;
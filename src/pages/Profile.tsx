import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import axios from 'axios';
import { User, Mail, Briefcase, BookOpen, Tag } from 'lucide-react';
import AuthContext from '../context/AuthContext';

interface ProfileFormData {
  name: string;
  email: string;
  department: string;
  skills: string;
}

const Profile: React.FC = () => {
  const { user } = useContext(AuthContext);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ProfileFormData>();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setValue('name', user.name);
      setValue('email', user.email);
      setValue('department', user.department);
      setValue('skills', user.skills.join(', '));
    }
  }, [user, setValue]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setLoading(true);
      
      // Convert skills string to array
      const skillsArray = data.skills.split(',').map(skill => skill.trim()).filter(Boolean);
      
      await axios.put('/api/auth/profile', {
        name: data.name,
        email: data.email,
        department: data.department,
        skills: skillsArray
      });
      
      toast.success('Profile updated successfully!');
      setLoading(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          <div className="flex items-center mb-6">
            <User className="h-8 w-8 text-indigo-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-800">Your Profile</h1>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <User className="h-5 w-5 text-indigo-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-800">Account</h3>
              </div>
              <div className="space-y-2">
                <p className="text-gray-600">SAP ID: <span className="font-medium text-gray-800">{user.sapId}</span></p>
                <p className="text-gray-600">Role: <span className="font-medium text-gray-800 capitalize">{user.role}</span></p>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Briefcase className="h-5 w-5 text-indigo-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-800">Department</h3>
              </div>
              <p className="font-medium">{user.department}</p>
            </div>
            
            {user.role === 'student' && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <BookOpen className="h-5 w-5 text-indigo-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-800">Team</h3>
                </div>
                {user.team ? (
                  <p className="font-medium">You are part of a team</p>
                ) : (
                  <p className="text-gray-600">You are not part of any team yet</p>
                )}
              </div>
            )}
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  type="text"
                  {...register('name', { required: 'Full name is required' })}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Briefcase className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="department"
                  type="text"
                  {...register('department', { required: 'Department is required' })}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {errors.department && (
                <p className="mt-1 text-sm text-red-600">{errors.department.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-1">
                Skills (comma separated)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Tag className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="skills"
                  type="text"
                  {...register('skills')}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., JavaScript, React, Node.js"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition disabled:opacity-70"
              >
                {loading ? 'Updating...' : 'Update Profile'}
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
        </div>
      </div>
    </div>
  );
};

export default Profile;
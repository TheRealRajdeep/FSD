import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { UserPlus, Upload } from 'lucide-react';
import AuthContext from '../context/AuthContext';

interface RegisterFormData {
  sapId: string;
  username: string;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'student' | 'faculty' | 'reviewer';
  department: string;
  skills: string;
}

const Register: React.FC = () => {
  const { register, handleSubmit, watch, formState: { errors }, setValue } = useForm<RegisterFormData>({
    defaultValues: {
      role: 'student'
    }
  });
  const [selectedRole, setSelectedRole] = useState<'student' | 'faculty' | 'reviewer'>('student');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { register: registerUser, user, error, clearError } = useContext(AuthContext);
  const navigate = useNavigate();

  const password = watch('password');
  const role = watch('role');

  useEffect(() => {
    setSelectedRole(role);
  }, [role]);

  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    // Show error toast if there's an error
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResumeFile(file);
    setUploading(true);

    // Here we would normally send the resume to a backend service for parsing
    // For demonstration, we'll simulate skills extraction after a brief delay
    try {
      // Simulate API call to extract skills from resume
      setTimeout(() => {
        // Mock extracted skills - in a real app this would come from the backend
        const mockExtractedSkills = "JavaScript, React, Node.js, TypeScript";
        setValue('skills', mockExtractedSkills);
        toast.success('Skills extracted from resume');
        setUploading(false);
      }, 1500);
    } catch (error) {
      toast.error('Failed to parse resume');
      setUploading(false);
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Convert skills string to array if it's provided
    const skillsArray = data.skills ? data.skills.split(',').map(skill => skill.trim()).filter(Boolean) : [];

    // Create userData based on role
    let userData: any = {
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role
    };

    // Add role-specific fields
    if (data.role === 'student') {
      userData = {
        ...userData,
        sapId: data.sapId,
        department: data.department,
        skills: skillsArray
      };

      // If we have a resume, we would upload it here
      if (resumeFile) {
        // Mock resume upload - in a real app we would send the file to the backend
        console.log('Resume would be uploaded:', resumeFile.name);
      }
    } else if (data.role === 'faculty') {
      userData = {
        ...userData,
        username: data.username,
        department: data.department
      };
    }

    await registerUser(userData);
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-lg mb-8">
      <div className="p-8">
        <div className="flex justify-center mb-6">
          <UserPlus className="h-12 w-12 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Register for IPD Portal</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              id="role"
              {...register('role', { required: 'Role is required' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="reviewer">Reviewer</option>
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
            )}
          </div>

          {/* Student specific fields */}
          {selectedRole === 'student' && (
            <>
              <div>
                <label htmlFor="sapId" className="block text-sm font-medium text-gray-700 mb-1">
                  SAP ID
                </label>
                <input
                  id="sapId"
                  type="text"
                  {...register('sapId', { required: selectedRole === 'student' ? 'SAP ID is required' : false })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter your SAP ID"
                />
                {errors.sapId && (
                  <p className="mt-1 text-sm text-red-600">{errors.sapId.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  id="department"
                  type="text"
                  {...register('department', { required: selectedRole === 'student' ? 'Department is required' : false })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter your department"
                />
                {errors.department && (
                  <p className="mt-1 text-sm text-red-600">{errors.department.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="resume" className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Resume (PDF)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="resume"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="resume"
                          name="resume"
                          type="file"
                          accept=".pdf"
                          className="sr-only"
                          onChange={handleResumeUpload}
                          disabled={uploading}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF up to 10MB</p>
                    {resumeFile && (
                      <p className="text-sm text-indigo-600">{resumeFile.name}</p>
                    )}
                    {uploading && (
                      <p className="text-sm text-indigo-600">Extracting skills...</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-1">
                  Skills (comma separated)
                </label>
                <input
                  id="skills"
                  type="text"
                  {...register('skills')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., JavaScript, React, Node.js"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Skills will be automatically extracted from your resume, or you can edit them manually.
                </p>
              </div>
            </>
          )}

          {/* Faculty specific fields */}
          {selectedRole === 'faculty' && (
            <>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  {...register('username', { required: selectedRole === 'faculty' ? 'Username is required' : false })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter your username"
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  id="department"
                  type="text"
                  {...register('department', { required: selectedRole === 'faculty' ? 'Department is required' : false })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter your department"
                />
                {errors.department && (
                  <p className="mt-1 text-sm text-red-600">{errors.department.message}</p>
                )}
              </div>
            </>
          )}

          {/* Common fields for all roles */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              {...register('name', { required: 'Full name is required' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter your full name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
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
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter your password"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: value => value === password || 'Passwords do not match'
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Confirm your password"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
            >
              Register
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-indigo-600 hover:text-indigo-500">
              Login here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
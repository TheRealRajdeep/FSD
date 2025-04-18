import React, { useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import Select from 'react-select';
import ReactMarkdown from 'react-markdown';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Users, Upload, Code, BookOpen, Target, Tags } from 'lucide-react';
import AuthContext from '../../context/AuthContext';
import { customSelectStyles } from '../../components/SelectStyles';

interface TeamFormData {
  name: string;
  description: string;
  maxMembers: number;
  projectIdea: string;
  techStack: string[];
  lookingFor: string[];
  githubUrl?: string;
}

const techOptions = [
  { value: 'react', label: 'React' },
  { value: 'node', label: 'Node.js' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'angular', label: 'Angular' },
  { value: 'vue', label: 'Vue.js' },
  { value: 'mongodb', label: 'MongoDB' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'aws', label: 'AWS' },
  { value: 'docker', label: 'Docker' },
];

const roleOptions = [
  { value: 'frontend', label: 'Frontend Developer' },
  { value: 'backend', label: 'Backend Developer' },
  { value: 'fullstack', label: 'Full Stack Developer' },
  { value: 'ui-ux', label: 'UI/UX Designer' },
  { value: 'devops', label: 'DevOps Engineer' },
  { value: 'mobile', label: 'Mobile Developer' },
];

const TeamCreate: React.FC = () => {
  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm<TeamFormData>({
    defaultValues: {
      techStack: [],
      lookingFor: []
    }
  });
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const description = watch('description');
  const projectIdea = watch('projectIdea');

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: 'image/*',
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  });

  const onSubmit = async (data: TeamFormData) => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('maxMembers', data.maxMembers.toString());
      formData.append('projectIdea', data.projectIdea || '');

      if (data.techStack && data.techStack.length > 0) {
        formData.append('techStack', JSON.stringify(data.techStack));
      }

      if (data.lookingFor && data.lookingFor.length > 0) {
        formData.append('lookingFor', JSON.stringify(data.lookingFor));
      }

      if (data.githubUrl) {
        formData.append('githubUrl', data.githubUrl);
      }

      if (logo) {
        formData.append('logo', logo);
      }

      await axios.post('/api/teams', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Team created successfully');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Create a Team</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-4">
          <label className="block text-gray-700">Team Name</label>
          <input
            type="text"
            {...register('name', { required: true })}
            className="w-full border p-2"
          />
          {errors.name && <p className="text-red-500">Team name is required</p>}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Description</label>
          <textarea
            {...register('description', { required: true })}
            className="w-full border p-2"
          ></textarea>
          {errors.description && <p className="text-red-500">Description is required</p>}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Maximum Members</label>
          <input
            type="number"
            {...register('maxMembers', { required: true, valueAsNumber: true })}
            className="w-full border p-2"
          />
          {errors.maxMembers && <p className="text-red-500">Maximum members is required</p>}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Project Idea</label>
          <textarea
            {...register('projectIdea')}
            className="w-full border p-2"
          ></textarea>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Tech Stack</label>
          <Controller
            control={control}
            name="techStack"
            render={({ field }) => (
              <Select
                isMulti
                options={techOptions}
                classNamePrefix="select"
                styles={customSelectStyles}
                placeholder="Select technologies..."
                onChange={(selectedOptions) => {
                  const values = selectedOptions ?
                    selectedOptions.map(option => option.value) :
                    [];
                  field.onChange(values);
                }}
                value={techOptions.filter(option =>
                  field.value && field.value.includes(option.value)
                )}
              />
            )}
          />
          <p className="mt-1 text-xs text-gray-500">
            Select all technologies your team plans to use
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Looking For</label>
          <Controller
            control={control}
            name="lookingFor"
            render={({ field }) => (
              <Select
                isMulti
                options={roleOptions}
                classNamePrefix="select"
                styles={customSelectStyles}
                placeholder="Select roles needed..."
                onChange={(selectedOptions) => {
                  const values = selectedOptions ?
                    selectedOptions.map(option => option.value) :
                    [];
                  field.onChange(values);
                }}
                value={roleOptions.filter(option =>
                  field.value && field.value.includes(option.value)
                )}
              />
            )}
          />
          <p className="mt-1 text-xs text-gray-500">
            Select roles you're looking to add to your team
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">GitHub URL (Optional)</label>
          <input
            type="url"
            {...register('githubUrl')}
            className="w-full border p-2"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Team Logo</label>
          <div {...getRootProps()} className="border-dashed border-2 p-4 text-center">
            <input {...getInputProps()} />
            {isDragActive ? (
              <p>Drop the image here ...</p>
            ) : (
              <p>Drag 'n' drop an image, or click to select one</p>
            )}
          </div>
          {logoPreview && <img src={logoPreview} alt="Team Logo Preview" className="mt-4 max-h-40" />}
        </div>

        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            {previewMode ? 'Edit Mode' : 'Preview Mode'}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            {loading ? 'Creating...' : 'Create Team'}
          </button>
        </div>
      </form>

      {previewMode && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-2">Preview</h2>
          <div className="border p-4">
            <h3 className="text-lg font-semibold">{watch('name')}</h3>
            <p>{description}</p>
            <ReactMarkdown>{projectIdea || ''}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamCreate;

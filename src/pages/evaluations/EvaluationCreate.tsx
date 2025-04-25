import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'react-toastify';
import axios from 'axios';
import { ClipboardList, Plus, Trash2 } from 'lucide-react';
import AuthContext from '../../context/AuthContext';

interface Project {
  _id: string;
  title: string;
  team: {
    _id: string;
    name: string;
  };
}

interface RubricItem {
  criterion: string;
  description: string;
  maxScore: number;
}

interface EvaluationFormData {
  projectId: string;
  evaluationType: string;
  dueDate: string;
  rubricItems: RubricItem[];
}

const EvaluationCreate: React.FC = () => {
  const { register, control, handleSubmit, formState: { errors } } = useForm<EvaluationFormData>({
    defaultValues: {
      rubricItems: [
        { criterion: '', description: '', maxScore: 5 } // Changed from 10 to 5
      ]
    }
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'rubricItems'
  });

  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoadingProjects(true);
        const res = await axios.get('/api/projects');
        setProjects(res.data);
        setLoadingProjects(false);
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast.error('Failed to load projects');
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, []);

  const onSubmit = async (data: EvaluationFormData) => {
    try {
      setLoading(true);
      await axios.post('/api/evaluations', data);
      toast.success('Evaluation created successfully!');
      navigate('/evaluations');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create evaluation');
      setLoading(false);
    }
  };

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-md overflow-hidden p-8">
        <div className="flex items-center mb-6">
          <ClipboardList className="h-8 w-8 text-indigo-600 mr-3" />
          <h1 className="text-2xl font-bold text-gray-800">Create New Evaluation</h1>
        </div>

        {loadingProjects ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 mb-1">
                Select Project
              </label>
              <select
                id="projectId"
                {...register('projectId', { required: 'Project is required' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select a project</option>
                {projects.map(project => (
                  <option key={project._id} value={project._id}>
                    {project.title} - {project.team.name}
                  </option>
                ))}
              </select>
              {errors.projectId && (
                <p className="mt-1 text-sm text-red-600">{errors.projectId.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="evaluationType" className="block text-sm font-medium text-gray-700 mb-1">
                Evaluation Type
              </label>
              <select
                id="evaluationType"
                {...register('evaluationType', { required: 'Evaluation type is required' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select evaluation type</option>
                <option value="milestone">Milestone</option>
                <option value="final">Final</option>
              </select>
              {errors.evaluationType && (
                <p className="mt-1 text-sm text-red-600">{errors.evaluationType.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                id="dueDate"
                type="date"
                min={today}
                {...register('dueDate', { required: 'Due date is required' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.dueDate && (
                <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-800">Rubric Items</h3>
                <button
                  type="button"
                  onClick={() => append({ criterion: '', description: '', maxScore: 5 })}
                  className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-md hover:bg-indigo-200 transition flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium text-gray-800">Item {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-red-600 hover:text-red-800 transition"
                      disabled={fields.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor={`rubricItems.${index}.criterion`} className="block text-sm font-medium text-gray-700 mb-1">
                        Criterion
                      </label>
                      <input
                        id={`rubricItems.${index}.criterion`}
                        type="text"
                        {...register(`rubricItems.${index}.criterion` as const, {
                          required: 'Criterion is required'
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g., Technical Implementation"
                      />
                      {errors.rubricItems?.[index]?.criterion && (
                        <p className="mt-1 text-sm text-red-600">{errors.rubricItems[index]?.criterion?.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor={`rubricItems.${index}.description`} className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        id={`rubricItems.${index}.description`}
                        rows={2}
                        {...register(`rubricItems.${index}.description` as const)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Describe what this criterion evaluates"
                      ></textarea>
                    </div>

                    <div>
                      <label htmlFor={`rubricItems.${index}.maxScore`} className="block text-sm font-medium text-gray-700 mb-1">
                        Maximum Score
                      </label>
                      <input
                        id={`rubricItems.${index}.maxScore`}
                        type="number"
                        min="1"
                        max="5" // Changed from 100 to 5
                        {...register(`rubricItems.${index}.maxScore` as const, {
                          required: 'Max score is required',
                          min: {
                            value: 1,
                            message: 'Score must be at least 1'
                          },
                          max: {
                            value: 5, // Changed from 100 to 5
                            message: 'Score cannot exceed 5' // Updated error message
                          }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      {errors.rubricItems?.[index]?.maxScore && (
                        <p className="mt-1 text-sm text-red-600">{errors.rubricItems[index]?.maxScore?.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition disabled:opacity-70"
              >
                {loading ? 'Creating...' : 'Create Evaluation'}
              </button>

              <button
                type="button"
                onClick={() => navigate('/evaluations')}
                className="border border-gray-300 text-gray-700 py-2 px-6 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EvaluationCreate;
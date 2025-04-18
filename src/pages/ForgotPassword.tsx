import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, ArrowLeft, ExternalLink } from 'lucide-react';
import axios from 'axios';

interface ForgotPasswordFormData {
    email: string;
}

interface DevModeData {
    previewUrl?: string;
    resetToken?: string;
    resetUrl?: string;
}

const ForgotPassword: React.FC = () => {
    const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>();
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [devModeData, setDevModeData] = useState<DevModeData | null>(null);
    const navigate = useNavigate();

    const onSubmit = async (data: ForgotPasswordFormData) => {
        try {
            setLoading(true);
            const response = await axios.post('/api/auth/forgot-password', { email: data.email });

            setEmailSent(true);

            // Check if we received development mode information
            if (response.data.previewUrl || response.data.resetToken || response.data.resetUrl) {
                setDevModeData({
                    previewUrl: response.data.previewUrl,
                    resetToken: response.data.resetToken,
                    resetUrl: response.data.resetUrl
                });
                toast.info('Development mode: Email preview or direct reset link available');
            } else {
                toast.success('Password reset email sent! Check your inbox.');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    const handleDirectReset = () => {
        if (devModeData?.resetToken) {
            navigate(`/reset-password/${devModeData.resetToken}`);
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-lg mt-10">
            <div className="p-8">
                <div className="flex justify-center mb-6">
                    <KeyRound className="h-12 w-12 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
                    Forgot Password
                </h2>

                {!emailSent ? (
                    <>
                        <p className="text-gray-600 mb-6 text-center">
                            Enter your email address and we'll send you a link to reset your password.
                        </p>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Address
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
                                    placeholder="Enter your registered email"
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                                )}
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition disabled:opacity-70"
                                >
                                    {loading ? 'Sending...' : 'Send Reset Link'}
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="text-center">
                        <div className="bg-green-50 p-4 rounded-md mb-6">
                            <p className="text-green-800">
                                We've sent an email to reset your password. Please check your inbox and follow the instructions.
                            </p>
                        </div>

                        {/* Development mode options */}
                        {devModeData && (
                            <div className="mt-4 mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                                <h3 className="text-sm font-semibold text-yellow-800 mb-2">Development Mode</h3>

                                {devModeData.previewUrl && (
                                    <div className="mb-3">
                                        <a
                                            href={devModeData.previewUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center text-blue-600 hover:text-blue-800"
                                        >
                                            View Email Preview <ExternalLink className="ml-1 h-4 w-4" />
                                        </a>
                                    </div>
                                )}

                                {devModeData.resetToken && (
                                    <button
                                        onClick={handleDirectReset}
                                        className="mt-2 bg-blue-600 text-white text-sm py-2 px-4 rounded hover:bg-blue-700"
                                    >
                                        Use Direct Reset Link
                                    </button>
                                )}
                            </div>
                        )}

                        <p className="text-gray-600 mb-4">
                            Didn't receive the email? Check your spam folder or request another one.
                        </p>
                        <button
                            onClick={() => setEmailSent(false)}
                            className="text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                            Try again
                        </button>
                    </div>
                )}

                <div className="mt-6 flex justify-center">
                    <Link to="/login" className="flex items-center text-indigo-600 hover:text-indigo-800">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;

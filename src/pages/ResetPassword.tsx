import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { KeyRound, Check } from 'lucide-react';
import axios from 'axios';

interface ResetPasswordFormData {
    password: string;
    confirmPassword: string;
}

const ResetPassword: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetPasswordFormData>();
    const [loading, setLoading] = useState(false);
    const [validToken, setValidToken] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [resetComplete, setResetComplete] = useState(false);

    const password = watch('password');

    // Verify token on component mount
    useEffect(() => {
        const verifyToken = async () => {
            try {
                await axios.get(`/api/auth/reset-password/${token}`);
                setValidToken(true);
            } catch (error) {
                toast.error('Invalid or expired reset token');
            } finally {
                setVerifying(false);
            }
        };

        verifyToken();
    }, [token]);

    const onSubmit = async (data: ResetPasswordFormData) => {
        if (data.password !== data.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        try {
            setLoading(true);
            await axios.post(`/api/auth/reset-password/${token}`, {
                password: data.password
            });

            setResetComplete(true);
            toast.success('Password reset successful');

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    if (verifying) {
        return (
            <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-lg mt-10 p-8">
                <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
                <p className="text-center mt-4 text-gray-600">Verifying your reset link...</p>
            </div>
        );
    }

    if (!validToken) {
        return (
            <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-lg mt-10 p-8">
                <div className="text-center">
                    <div className="bg-red-50 p-4 rounded-md mb-6">
                        <p className="text-red-800">
                            This password reset link is invalid or has expired.
                        </p>
                    </div>
                    <Link
                        to="/forgot-password"
                        className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
                    >
                        Request New Link
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-lg mt-10">
            <div className="p-8">
                <div className="flex justify-center mb-6">
                    <KeyRound className="h-12 w-12 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
                    Reset Password
                </h2>

                {!resetComplete ? (
                    <>
                        <p className="text-gray-600 mb-6 text-center">
                            Enter your new password below.
                        </p>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                    New Password
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
                                    placeholder="Enter new password"
                                />
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirm New Password
                                </label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    {...register('confirmPassword', {
                                        required: 'Please confirm your password',
                                        validate: value => value === password || 'Passwords do not match'
                                    })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Confirm new password"
                                />
                                {errors.confirmPassword && (
                                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                                )}
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition disabled:opacity-70"
                                >
                                    {loading ? 'Resetting...' : 'Reset Password'}
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="text-center">
                        <div className="flex justify-center mb-4">
                            <div className="rounded-full bg-green-100 p-2">
                                <Check className="h-8 w-8 text-green-600" />
                            </div>
                        </div>
                        <h3 className="text-xl font-medium text-gray-900 mb-2">Password Reset Successfully</h3>
                        <p className="text-gray-600 mb-4">
                            Your password has been reset successfully. You will be redirected to the login page shortly.
                        </p>
                        <Link
                            to="/login"
                            className="inline-block bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
                        >
                            Go to Login
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navigation from '@/components/ui/navigation';
import PageLoader from '@/components/ui/page-loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { getDominantEmotion } from '@/lib/emotions';
import { Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentEmotion = getDominantEmotion();
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Check if we have the required tokens
  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    
    if (!accessToken || !refreshToken) {
      setErrors({ submit: 'Invalid reset link. Please request a new password reset.' });
    }
  }, [searchParams]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    
    if (!accessToken || !refreshToken) {
      setErrors({ submit: 'Invalid reset link. Please request a new password reset.' });
      return;
    }

    setLoading(true);
    try {
      // Set the session with the tokens from the URL
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      if (sessionError) {
        setErrors({ submit: 'Invalid or expired reset link. Please request a new password reset.' });
        return;
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (updateError) {
        setErrors({ submit: updateError.message });
      } else {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login?message=Password updated successfully');
        }, 3000);
      }
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <PageLoader 
        type="general" 
        emotion={currentEmotion} 
        message="Password updated successfully"
        minLoadTime={1500}
      >
        <div className="min-h-screen bg-black relative overflow-hidden">
          <Navigation />
          
          <div className="relative z-10 min-h-screen flex items-center justify-center p-4 pt-20">
            <Card className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border-0 shadow-white/20">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-black mb-2">Password Updated!</h1>
                  <p className="text-gray-600">
                    Your password has been successfully updated. You will be redirected to the login page shortly.
                  </p>
                </div>
                
                <Button
                  onClick={() => router.push('/login')}
                  className="w-full h-12 bg-black text-white rounded-xl hover:bg-gray-800 transition-all duration-300"
                >
                  Go to Login
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageLoader>
    );
  }

  return (
    <PageLoader 
      type="general" 
      emotion={currentEmotion} 
      message="Loading password reset"
      minLoadTime={2000}
    >
      <div className="min-h-screen bg-black relative overflow-hidden">
        <Navigation />
        
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4 pt-20">
          <Card className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border-0 shadow-white/20">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-black mb-2">Reset Password</h1>
                <p className="text-gray-600">
                  Enter your new password below
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Password */}
                <div>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your new password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`h-14 bg-gray-50 border-2 border-gray-400 rounded-xl transition-all duration-300 hover:border-gray-600 focus:border-black focus:bg-white text-black placeholder-gray-600 text-base pr-12 shadow-lg hover:shadow-xl focus:shadow-2xl ${
                        errors.password ? 'border-red-500' : ''
                      }`}
                      disabled={loading}
                      style={{
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-black transition-colors"
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-2">{errors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your new password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className={`h-14 bg-gray-50 border-2 border-gray-400 rounded-xl transition-all duration-300 hover:border-gray-600 focus:border-black focus:bg-white text-black placeholder-gray-600 text-base pr-12 shadow-lg hover:shadow-xl focus:shadow-2xl ${
                        errors.confirmPassword ? 'border-red-500' : ''
                      }`}
                      disabled={loading}
                      style={{
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-black transition-colors"
                      disabled={loading}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-2">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* Submit Error */}
                {errors.submit && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                    <p className="text-red-600 text-sm font-medium">{errors.submit}</p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-black text-white rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] text-base hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium hover:shadow-xl shadow-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Button
                  variant="ghost"
                  onClick={() => router.push('/login')}
                  className="text-gray-600 hover:text-black transition-colors"
                >
                  Back to Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLoader>
  );
}
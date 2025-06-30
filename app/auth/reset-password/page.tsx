'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navigation from '@/components/ui/navigation';
import PageLoader from '@/components/ui/page-loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { getDominantEmotion } from '@/lib/emotions';
import { Loader2, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react';

interface Star {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentEmotion = getDominantEmotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const starsRef = useRef<Star[]>([]);
  const animationRef = useRef<number>();
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Enhanced interactive starry background - same as login/signup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Create interactive stars
    starsRef.current = Array.from({ length: 200 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.8 + 0.2,
      twinkleSpeed: Math.random() * 0.02 + 0.01,
      twinkleOffset: Math.random() * Math.PI * 2,
    }));

    const animate = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Enhanced mouse influence
      const mouseInfluence = 150;
      const mouseForce = 0.02;

      starsRef.current.forEach((star) => {
        // Mouse interaction
        const dx = mouseRef.current.x - star.x;
        const dy = mouseRef.current.y - star.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouseInfluence) {
          const force = (mouseInfluence - distance) / mouseInfluence;
          const acceleration = force * mouseForce;
          star.vx += (dx / distance) * acceleration;
          star.vy += (dy / distance) * acceleration;
        }

        // Update position
        star.x += star.vx;
        star.y += star.vy;

        // Boundary check with wrapping
        if (star.x < 0) star.x = canvas.width;
        if (star.x > canvas.width) star.x = 0;
        if (star.y < 0) star.y = canvas.height;
        if (star.y > canvas.height) star.y = 0;

        // Friction for smoother movement
        star.vx *= 0.995;
        star.vy *= 0.995;

        // Twinkling effect
        const twinkle = 0.5 + 0.5 * Math.sin(Date.now() * star.twinkleSpeed + star.twinkleOffset);
        const currentOpacity = star.opacity * twinkle;

        // Draw star with glow effect
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        
        // Create radial gradient for glow
        const gradient = ctx.createRadialGradient(
          star.x, star.y, 0,
          star.x, star.y, star.size * 3
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${currentOpacity})`);
        gradient.addColorStop(0.4, `rgba(200, 220, 255, ${currentOpacity * 0.6})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.fill();

        // Add cross-shaped sparkle for larger stars
        if (star.size > 2) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${currentOpacity * 0.8})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(star.x - star.size * 2, star.y);
          ctx.lineTo(star.x + star.size * 2, star.y);
          ctx.moveTo(star.x, star.y - star.size * 2);
          ctx.lineTo(star.x, star.y + star.size * 2);
          ctx.stroke();
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Enhanced mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

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

  // Success state with consistent styling
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
          
          {/* Interactive Starry Background */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ width: "100%", height: "100%" }}
          />
          
          <div className="relative z-10 min-h-screen flex items-center justify-center p-4 pt-20">
            <Card className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border-0 shadow-white/20">
              <CardContent className="p-8 lg:p-12 text-center">
                <div className="mb-8">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-12 w-12 text-green-500" />
                  </div>
                  <h1 className="text-3xl lg:text-4xl font-normal text-black mb-4 tracking-tight leading-tight font-serif">
                    Password Updated!
                  </h1>
                  <p className="text-base lg:text-lg text-gray-600 leading-relaxed">
                    Your password has been successfully updated. You will be redirected to the login page shortly.
                  </p>
                </div>
                
                <Button
                  onClick={() => router.push('/login')}
                  className="w-full h-14 bg-black text-white rounded-xl hover:bg-gray-800 transition-all duration-300 transform hover:scale-[1.02] text-base font-medium shadow-lg hover:shadow-xl"
                >
                  Continue to Login
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
        
        {/* Interactive Starry Background */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ width: "100%", height: "100%" }}
        />
        
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4 pt-20">
          <Card className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden border-0 shadow-white/20">
            <CardContent className="p-0 grid grid-cols-1 lg:grid-cols-2 min-h-[700px]">
              {/* Left Side - Saturn Image (same as login/signup) */}
              <div className="bg-black flex items-center justify-center p-6 relative">
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src="/ChatGPT Image Jun 28, 2025, 11_07_46 PM 1.png"
                    alt="Cosmic visualization with Saturn and figure on cliff contemplating the universe"
                    className="w-full h-full object-cover rounded-2xl"
                    style={{ 
                      minHeight: '600px',
                      maxHeight: '650px'
                    }}
                  />
                </div>
              </div>

              {/* Right Side - Form */}
              <div className="p-8 lg:p-12 flex flex-col justify-center bg-white text-black relative">
                <div className="relative z-10">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <h1 className="text-4xl lg:text-5xl font-normal text-black mb-4 tracking-tight leading-tight font-serif">
                      Reset Your Password
                    </h1>
                    <p className="text-base lg:text-lg text-gray-600 leading-relaxed">
                      Enter your new password below to secure your account
                    </p>
                  </div>

                  {/* Back to Login Link */}
                  <div className="text-center mb-8">
                    <Button
                      variant="ghost"
                      onClick={() => router.push('/login')}
                      className="text-gray-600 hover:text-black transition-all duration-300 transform hover:scale-105 p-0 h-auto font-medium"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Login
                    </Button>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto w-full">
                    {/* Password */}
                    <div>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your new password (min 6 characters)"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          className={`h-14 bg-gray-50 border-2 border-gray-400 rounded-xl transition-all duration-300 hover:border-gray-600 focus:border-black focus:bg-white text-black placeholder-gray-600 text-base pr-12 shadow-lg hover:shadow-xl focus:shadow-2xl transform hover:scale-[1.02] focus:scale-[1.02] ${
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
                        <p className="text-red-500 text-sm mt-2 font-medium">{errors.password}</p>
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
                          className={`h-14 bg-gray-50 border-2 border-gray-400 rounded-xl transition-all duration-300 hover:border-gray-600 focus:border-black focus:bg-white text-black placeholder-gray-600 text-base pr-12 shadow-lg hover:shadow-xl focus:shadow-2xl transform hover:scale-[1.02] focus:scale-[1.02] ${
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
                        <p className="text-red-500 text-sm mt-2 font-medium">{errors.confirmPassword}</p>
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
                      className="w-full h-14 bg-black text-white rounded-xl transition-all duration-300 transform hover:scale-[1.05] active:scale-[0.98] mt-8 text-base hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400 disabled:transform-none font-medium hover:shadow-xl shadow-lg"
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

                  {/* Security Note */}
                  <div className="mt-8 max-w-md mx-auto">
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                      <p className="text-blue-600 text-sm font-medium text-center">
                        🔒 Your new password will be securely encrypted and stored.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLoader>
  );
}
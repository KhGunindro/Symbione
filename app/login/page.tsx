'use client';

import React, { useEffect, useRef, useState } from "react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/ui/navigation';
import PageLoader from '@/components/ui/page-loader';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { supabase } from '@/lib/supabase';
import { getDominantEmotion } from '@/lib/emotions';
import { Loader2 } from 'lucide-react';

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

export default function LoginPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const starsRef = useRef<Star[]>([]);
  const animationRef = useRef<number>();
  const currentEmotion = getDominantEmotion();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  const [userName, setUserName] = useState<string>('Sweetam');

  // Load saved user data on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('lastLoginEmail');
    const savedName = localStorage.getItem('lastLoginName');
    
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
    }
    
    if (savedName) {
      setUserName(savedName);
    } else if (savedEmail) {
      // Extract name from email if no saved name
      const emailName = savedEmail.split('@')[0];
      const formattedName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
      setUserName(formattedName);
    }
  }, []);

  // Update user name when email changes
  useEffect(() => {
    if (formData.email && formData.email.includes('@')) {
      const emailName = formData.email.split('@')[0];
      const formattedName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
      setUserName(formattedName);
    } else if (formData.email === '') {
      // Reset to default when email is cleared
      const savedName = localStorage.getItem('lastLoginName');
      setUserName(savedName || 'Sweetam');
    }
  }, [formData.email]);

  // Enhanced interactive starry background
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

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrors({ submit: 'Invalid credentials. Please check your email and password.' });
        } else {
          setErrors({ submit: error.message });
        }
      } else if (data.user) {
        // Save email and name for future logins
        localStorage.setItem('lastLoginEmail', formData.email);
        localStorage.setItem('lastLoginName', userName);
        router.push('/');
      }
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('Google login error:', error);
        setErrors({ submit: 'Google login failed. Please try again.' });
      }
      // If successful, user will be redirected to Google OAuth
    } catch (error) {
      console.error('Unexpected Google login error:', error);
      setErrors({ submit: 'Google login failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email.trim()) {
      setErrors({ email: 'Please enter your email address first' });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setForgotPasswordLoading(true);
    setForgotPasswordMessage('');
    setErrors({});

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) {
        setErrors({ submit: error.message });
      } else {
        setForgotPasswordMessage('Password reset email sent! Please check your inbox.');
      }
    } catch (error) {
      setErrors({ submit: 'Failed to send password reset email. Please try again.' });
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <PageLoader 
      type="general" 
      emotion={currentEmotion} 
      message="Preparing authentication"
      minLoadTime={2500}
    >
      <div className="min-h-screen bg-black relative overflow-hidden">
        <Navigation />
        
        {/* Interactive Starry Background */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ width: "100%", height: "100%" }}
        />

        {/* Main Content */}
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4 pt-20">
          <Card className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden border-0 shadow-white/20">
            <CardContent className="p-0 grid grid-cols-1 lg:grid-cols-2 min-h-[700px]">
              {/* Left Side - Saturn Image */}
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
                  {/* Main Heading with Dynamic Name */}
                  <h1 className="text-4xl lg:text-5xl font-normal text-black mb-8 text-center tracking-tight leading-tight font-serif">
                    Welcome Back {userName}
                  </h1>

                  {/* Sign In Section */}
                  <div className="text-center mb-8">
                    <p className="text-base lg:text-lg text-gray-600">
                      Don't have an account?{" "}
                      <Link 
                        href="/signup"
                        className="underline cursor-pointer hover:text-black transition-all duration-300 text-black transform hover:scale-105"
                      >
                        Sign up
                      </Link>
                    </p>
                  </div>

                  {/* Google Login Button */}
                  <div className="mb-8 max-w-md mx-auto w-full">
                    <Button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={loading}
                      className="w-full h-14 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:border-black hover:bg-gray-50 transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center space-x-3 font-medium text-base shadow-lg hover:shadow-xl"
                    >
                      {loading ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        <svg className="h-6 w-6" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      )}
                      <span>Continue with Google</span>
                    </Button>
                  </div>

                  {/* Divider */}
                  <div className="relative mb-8 max-w-md mx-auto">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500">Or continue with email</span>
                    </div>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto w-full">
                    {/* Email */}
                    <div>
                      <Input
                        type="email"
                        placeholder="Enter your email address"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`h-14 bg-gray-50 border-2 border-gray-400 rounded-xl transition-all duration-300 hover:border-gray-600 focus:border-black focus:bg-white text-black placeholder-gray-600 text-base transform hover:scale-[1.02] focus:scale-[1.02] shadow-lg hover:shadow-xl focus:shadow-2xl ${
                          errors.email ? 'border-red-500' : ''
                        }`}
                        disabled={loading}
                        style={{
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                        }}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-2">{errors.email}</p>
                      )}
                    </div>

                    {/* Password */}
                    <div>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className={`h-14 bg-gray-50 border-2 border-gray-400 rounded-xl transition-all duration-300 hover:border-gray-600 focus:border-black focus:bg-white text-black placeholder-gray-600 text-base transform hover:scale-[1.02] focus:scale-[1.02] shadow-lg hover:shadow-xl focus:shadow-2xl ${
                          errors.password ? 'border-red-500' : ''
                        }`}
                        disabled={loading}
                        style={{
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                        }}
                      />
                      {errors.password && (
                        <p className="text-red-500 text-sm mt-2">{errors.password}</p>
                      )}
                    </div>

                    {/* Remember Me and Forgot Password */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="remember"
                          checked={formData.rememberMe}
                          onCheckedChange={(checked) => handleInputChange('rememberMe', checked as boolean)}
                          className="w-5 h-5 rounded border-2 border-gray-400 data-[state=checked]:bg-black data-[state=checked]:border-black data-[state=checked]:text-white transition-all duration-200 hover:scale-110"
                          disabled={loading}
                        />
                        <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer transition-colors duration-200 hover:text-black font-medium">
                          Remember Password
                        </label>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleForgotPassword}
                        disabled={forgotPasswordLoading}
                        className="text-sm text-gray-600 hover:text-black transition-all duration-300 transform hover:scale-105 font-medium p-0 h-auto"
                      >
                        {forgotPasswordLoading ? (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          'Forgot Password?'
                        )}
                      </Button>
                    </div>

                    {/* Forgot Password Success Message */}
                    {forgotPasswordMessage && (
                      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                        <p className="text-green-600 text-sm font-medium">{forgotPasswordMessage}</p>
                      </div>
                    )}

                    {/* Submit Error */}
                    {errors.submit && (
                      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 animate-pulse">
                        <p className="text-red-600 text-sm font-medium">{errors.submit}</p>
                      </div>
                    )}

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-14 bg-black text-white rounded-xl transition-all duration-300 transform hover:scale-[1.05] active:scale-[0.98] mt-8 text-base hover:bg-gray-800 disabled:bg-gray-400 disabled:text-gray-600 disabled:cursor-not-allowed disabled:hover:bg-gray-400 disabled:transform-none font-medium hover:shadow-xl shadow-lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Signing In...
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </form>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLoader>
  );
}
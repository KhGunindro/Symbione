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
import { Loader2, Eye, EyeOff } from 'lucide-react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

export default function SignupPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const currentEmotion = getDominantEmotion();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Initialize dynamic star particles for background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Create star particles with varied properties
    particlesRef.current = Array.from({ length: 250 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 1.8 + 0.4,
      opacity: Math.random() * 0.7 + 0.3,
    }));

    const animate = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Mouse influence
      const mouseInfluence = 150;
      const mouseForce = 0.025;

      particlesRef.current.forEach((particle) => {
        // Mouse interaction
        const dx = mouseRef.current.x - particle.x;
        const dy = mouseRef.current.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouseInfluence) {
          const force = (mouseInfluence - distance) / mouseInfluence;
          const acceleration = force * mouseForce;
          particle.vx += (dx / distance) * acceleration;
          particle.vy += (dy / distance) * acceleration;
        }

        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Boundary check with wrapping
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Friction
        particle.vx *= 0.996;
        particle.vy *= 0.996;

        // Draw star particle with enhanced glow effect
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        
        // Add star-like glow with twinkling effect
        const twinkle = 0.6 + 0.4 * Math.sin(Date.now() * 0.002 + particle.x * 0.008);
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 2.5
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${particle.opacity * twinkle})`);
        gradient.addColorStop(0.4, `rgba(180, 200, 255, ${particle.opacity * 0.5 * twinkle})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, ${particle.opacity * 0.05 * twinkle})`);
        
        ctx.fillStyle = gradient;
        ctx.fill();

        // Add cross-shaped star effect for larger particles
        if (particle.size > 1.2) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${particle.opacity * 0.7 * twinkle})`;
          ctx.lineWidth = 0.4;
          ctx.beginPath();
          ctx.moveTo(particle.x - particle.size * 1.8, particle.y);
          ctx.lineTo(particle.x + particle.size * 1.8, particle.y);
          ctx.moveTo(particle.x, particle.y - particle.size * 1.8);
          ctx.lineTo(particle.x, particle.y + particle.size * 1.8);
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

  // Mouse tracking
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

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!acceptTerms) {
      newErrors.terms = 'Please accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            full_name: `${formData.firstName} ${formData.lastName}`
          }
        }
      });

      if (error) {
        setErrors({ submit: error.message });
      } else if (data.user) {
        // Save data if remember is checked
        if (rememberPassword) {
          localStorage.setItem('lastLoginEmail', formData.email);
          localStorage.setItem('lastLoginName', formData.firstName);
        }
        router.push('/login?message=Please check your email to verify your account');
      }
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLoader 
      type="general" 
      emotion={currentEmotion} 
      message="Setting up your account"
      minLoadTime={2800}
    >
      <div className="min-h-screen bg-black relative overflow-hidden">
        <Navigation />
        
        {/* Dynamic Star Canvas Background */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ width: "100%", height: "100%" }}
        />

        {/* Main Content */}
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4 pt-20">
          <Card className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden shadow-white/10">
            <CardContent className="p-0 grid grid-cols-1 lg:grid-cols-2 min-h-[700px]">
              {/* Left Side - Form with White Glow */}
              <div className="p-8 lg:p-12 flex flex-col justify-center bg-white text-black relative">
                {/* Subtle white glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-l-3xl opacity-50" />
                <div className="absolute inset-0 shadow-[inset_0_0_50px_rgba(255,255,255,0.3)] rounded-l-3xl" />
                
                <div className="relative z-10">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <h1 className="text-4xl lg:text-5xl font-normal text-black mb-4 tracking-tight leading-tight font-serif">
                      Feel The World Emotions
                    </h1>
                    <h2 className="text-2xl font-semibold mb-4">Create an account</h2>
                    <p className="text-gray-600">
                      Already have an account?{" "}
                      <Link 
                        href="/login"
                        className="underline cursor-pointer hover:text-black transition-all duration-300 transform hover:scale-105"
                      >
                        Log In
                      </Link>
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto w-full">
                    {/* Name Fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Input
                          type="text"
                          placeholder="Enter your first name"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          className={`h-12 bg-gray-100 border-gray-300 rounded-lg transition-all duration-300 hover:border-gray-400 focus:border-black focus:bg-white text-black placeholder-gray-500 text-base transform hover:scale-[1.02] focus:scale-[1.02] ${
                            errors.firstName ? 'border-red-500' : ''
                          }`}
                          disabled={loading}
                        />
                        {errors.firstName && (
                          <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                        )}
                      </div>
                      <div>
                        <Input
                          type="text"
                          placeholder="Enter your last name"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          className={`h-12 bg-gray-100 border-gray-300 rounded-lg transition-all duration-300 hover:border-gray-400 focus:border-black focus:bg-white text-black placeholder-gray-500 text-base transform hover:scale-[1.02] focus:scale-[1.02] ${
                            errors.lastName ? 'border-red-500' : ''
                          }`}
                          disabled={loading}
                        />
                        {errors.lastName && (
                          <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                        )}
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <Input
                        type="email"
                        placeholder="Enter your email address"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`h-12 bg-gray-100 border-gray-300 rounded-lg transition-all duration-300 hover:border-gray-400 focus:border-black focus:bg-white text-black placeholder-gray-500 text-base transform hover:scale-[1.02] focus:scale-[1.02] ${
                          errors.email ? 'border-red-500' : ''
                        }`}
                        disabled={loading}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                      )}
                    </div>

                    {/* Password */}
                    <div>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Create a strong password (min 6 characters)"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          className={`h-12 bg-gray-100 border-gray-300 rounded-lg transition-all duration-300 hover:border-gray-400 focus:border-black focus:bg-white text-black placeholder-gray-500 text-base transform hover:scale-[1.02] focus:scale-[1.02] pr-12 ${
                            errors.password ? 'border-red-500' : ''
                          }`}
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-black transition-colors"
                          disabled={loading}
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm your password"
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          className={`h-12 bg-gray-100 border-gray-300 rounded-lg transition-all duration-300 hover:border-gray-400 focus:border-black focus:bg-white text-black placeholder-gray-500 text-base transform hover:scale-[1.02] focus:scale-[1.02] pr-12 ${
                            errors.confirmPassword ? 'border-red-500' : ''
                          }`}
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-black transition-colors"
                          disabled={loading}
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                      )}
                    </div>

                    {/* Checkboxes */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="terms"
                          checked={acceptTerms}
                          onCheckedChange={setAcceptTerms}
                          className="w-4 h-4 rounded border-gray-400 data-[state=checked]:bg-black data-[state=checked]:border-black data-[state=checked]:text-white transition-all duration-200 hover:scale-110"
                          disabled={loading}
                        />
                        <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer transition-colors duration-200 hover:text-black">
                          I agree to the Terms & Conditions
                        </label>
                      </div>
                      {errors.terms && (
                        <p className="text-red-500 text-sm">{errors.terms}</p>
                      )}

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="remember"
                          checked={rememberPassword}
                          onCheckedChange={setRememberPassword}
                          className="w-4 h-4 rounded border-gray-400 data-[state=checked]:bg-black data-[state=checked]:border-black data-[state=checked]:text-white transition-all duration-200 hover:scale-110"
                          disabled={loading}
                        />
                        <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer transition-colors duration-200 hover:text-black">
                          Remember Password
                        </label>
                      </div>
                    </div>

                    {/* Submit Error */}
                    {errors.submit && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-red-600 text-sm">{errors.submit}</p>
                      </div>
                    )}

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 bg-black text-white rounded-lg transition-all duration-300 transform hover:scale-[1.05] active:scale-[0.98] mt-6 text-base hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400 disabled:transform-none font-medium hover:shadow-lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </Button>
                  </form>

                  {/* Social Signup */}
                  <div className="mt-8 max-w-md mx-auto w-full">
                    <div className="text-center mb-4">
                      <span className="text-gray-600">Or Sign up with</span>
                    </div>
                    
                    <div className="flex justify-center space-x-4">
                      {/* Google */}
                      <Button
                        type="button"
                        variant="outline"
                        className="w-12 h-12 rounded-full border-gray-300 hover:border-black hover:bg-gray-50 transition-all duration-300 transform hover:scale-110"
                        disabled={loading}
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      </Button>
                      
                      {/* GitHub */}
                      <Button
                        type="button"
                        variant="outline"
                        className="w-12 h-12 rounded-full border-gray-300 hover:border-black hover:bg-gray-50 transition-all duration-300 transform hover:scale-110"
                        disabled={loading}
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                      </Button>
                      
                      {/* Discord */}
                      <Button
                        type="button"
                        variant="outline"
                        className="w-12 h-12 rounded-full border-gray-300 hover:border-black hover:bg-gray-50 transition-all duration-300 transform hover:scale-110"
                        disabled={loading}
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0002 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9554 2.4189-2.1568 2.4189Z"/>
                        </svg>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - New Saturn Cosmic Illustration */}
              <div className="bg-black flex items-center justify-center p-6 relative">
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src="/ChatGPT Image Jun 28, 2025, 11_07_46 PM 1.png"
                    alt="Cosmic visualization with Saturn and figure on cliff contemplating the universe"
                    className="w-full h-full object-cover rounded-2xl opacity-90"
                    style={{ 
                      minHeight: '600px',
                      maxHeight: '650px'
                    }}
                  />
                  {/* Overlay with cosmic elements */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLoader>
  );
}
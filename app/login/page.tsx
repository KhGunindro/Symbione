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

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  glow: number;
}

export default function LoginPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const currentEmotion = getDominantEmotion();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
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

  // Enhanced premium particle background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Create premium white particles with enhanced properties
    particlesRef.current = Array.from({ length: 400 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 2.5 + 0.5,
      opacity: Math.random() * 0.8 + 0.2,
      glow: Math.random() * 0.5 + 0.5,
    }));

    const animate = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Enhanced mouse influence
      const mouseInfluence = 200;
      const mouseForce = 0.04;

      particlesRef.current.forEach((particle) => {
        // Enhanced mouse interaction
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

        // Enhanced friction for smoother movement
        particle.vx *= 0.995;
        particle.vy *= 0.995;

        // Draw premium particle with enhanced glow effect
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        
        // Premium star-like glow with twinkling effect
        const twinkle = 0.6 + 0.4 * Math.sin(Date.now() * 0.002 + particle.x * 0.01);
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 4
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${particle.opacity * twinkle})`);
        gradient.addColorStop(0.3, `rgba(240, 248, 255, ${particle.opacity * 0.8 * twinkle})`);
        gradient.addColorStop(0.6, `rgba(220, 235, 255, ${particle.opacity * 0.4 * twinkle})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.fill();

        // Add premium cross-shaped star effect for larger particles
        if (particle.size > 1.8) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${particle.opacity * 0.9 * twinkle})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(particle.x - particle.size * 2.5, particle.y);
          ctx.lineTo(particle.x + particle.size * 2.5, particle.y);
          ctx.moveTo(particle.x, particle.y - particle.size * 2.5);
          ctx.lineTo(particle.x, particle.y + particle.size * 2.5);
          ctx.stroke();
        }

        // Add subtle sparkle effect
        if (Math.random() < 0.02) {
          ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity * twinkle})`;
          ctx.fillRect(particle.x - 1, particle.y - 1, 2, 2);
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

  return (
    <PageLoader 
      type="general" 
      emotion={currentEmotion} 
      message="Preparing authentication"
      minLoadTime={2500}
    >
      <div className="min-h-screen bg-black relative overflow-hidden">
        <Navigation />
        
        {/* Premium Interactive Particle Background */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ width: "100%", height: "100%" }}
        />

        {/* Main Content */}
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4 pt-20">
          <Card className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden border-0 shadow-white/20">
            <CardContent className="p-0 grid grid-cols-1 lg:grid-cols-2 min-h-[700px]">
              {/* Left Side - New Saturn Image */}
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

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto w-full">
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
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className={`h-12 bg-gray-100 border-gray-300 rounded-lg transition-all duration-300 hover:border-gray-400 focus:border-black focus:bg-white text-black placeholder-gray-500 text-base transform hover:scale-[1.02] focus:scale-[1.02] ${
                          errors.password ? 'border-red-500' : ''
                        }`}
                        disabled={loading}
                      />
                      {errors.password && (
                        <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                      )}
                    </div>

                    {/* Remember Me and Forgot Password */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="remember"
                          checked={formData.rememberMe}
                          onCheckedChange={(checked) => handleInputChange('rememberMe', checked as boolean)}
                          className="w-4 h-4 rounded border-gray-400 data-[state=checked]:bg-black data-[state=checked]:border-black data-[state=checked]:text-white transition-all duration-200 hover:scale-110"
                          disabled={loading}
                        />
                        <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer transition-colors duration-200 hover:text-black">
                          Remember Password
                        </label>
                      </div>
                      <Link
                        href="/forgot-password"
                        className="text-sm text-gray-600 hover:text-black transition-all duration-300 transform hover:scale-105"
                      >
                        Forgot Password?
                      </Link>
                    </div>

                    {/* Submit Error */}
                    {errors.submit && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 animate-pulse">
                        <p className="text-red-500 text-sm">{errors.submit}</p>
                      </div>
                    )}

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 bg-black text-white rounded-lg transition-all duration-300 transform hover:scale-[1.05] active:scale-[0.98] mt-6 text-base hover:bg-gray-800 disabled:bg-gray-400 disabled:text-gray-600 disabled:cursor-not-allowed disabled:hover:bg-gray-400 disabled:transform-none font-medium hover:shadow-lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
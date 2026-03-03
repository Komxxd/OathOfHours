import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authClient } from '../auth';
import { Mail, Lock, User, ArrowLeft, Shield, Eye, EyeOff } from 'lucide-react';
import navSound from '../assets/audio/nomagician-ui-button-sound-cancel-back-exit-continue-467877.mp3';

const AuthPage = ({ setSession, setUser }) => {
    const location = useLocation();
    const [isSignUp, setIsSignUp] = useState(location.state?.isSignUp ?? false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = isSignUp
                ? await authClient.signUp.email({ name: name || email.split('@')[0], email, password })
                : await authClient.signIn.email({ email, password });

            if (result.error) {
                alert(result.error.message);
                return;
            }

            const sessionResult = await authClient.getSession();
            if (sessionResult.data?.session && sessionResult.data?.user) {
                setSession(sessionResult.data.session);
                setUser(sessionResult.data.user);
                navigate('/dashboard');
            }
        } catch (err) {
            console.error(err);
            alert('Authentication failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10 souls-bg">
            <div className="w-full max-w-md">
                <button
                    onClick={() => {
                        const audio = new Audio(navSound);
                        audio.volume = 0.5;
                        audio.play();
                        setTimeout(() => navigate('/'), 200);
                    }}
                    className="flex items-center gap-2 text-[#a89f91] hover:text-[#fdf5d3] font-souls transition-colors mb-8 group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    BACK
                </button>

                <div className="bg-[#050505]/90 p-8 md:p-10 border border-[#cbaa64]/20 relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-md">

                    {/* Corner Ornaments */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#cbaa64]/60" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#cbaa64]/60" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[#cbaa64]/60" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#cbaa64]/60" />

                    {/* Background Ambient Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-48 bg-[#cbaa64]/5 blur-[80px] pointer-events-none" />

                    <div className="flex flex-col items-center text-center mb-10 relative z-10">
                        <div className="p-3 bg-gradient-to-b from-[#cbaa64]/20 to-transparent border border-[#cbaa64]/10 rounded-full text-[#fdf5d3] mb-6 shadow-[0_0_15px_rgba(203,170,100,0.1)]">
                            <Shield size={32} />
                        </div>
                        <h1 className="text-3xl font-souls-title tracking-widest"
                            style={{
                                background: 'linear-gradient(to bottom, #ffffff 0%, #fdf5d3 60%, #cbaa64 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            {isSignUp ? 'SWEAR THE OATH' : 'RETURN TO ORDER'}
                        </h1>
                        <p className="text-[#a89f91] font-souls text-sm mt-3 tracking-widest opacity-80 uppercase">
                            {isSignUp ? 'Begin your legacy' : 'Authenticate your soul'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        {isSignUp && (
                            <div className="space-y-2">
                                <label className="text-xs font-souls tracking-widest text-[#a89f91] ml-1 uppercase">Name</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a89f91] group-focus-within:text-[#fdf5d3] transition-colors" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Grandmaster"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required={isSignUp}
                                        className="w-full bg-[#050505] border border-[#cbaa64]/20 py-4 pl-12 pr-4 text-[#e8dac1] focus:outline-none focus:border-[#cbaa64]/70 focus:bg-[#cbaa64]/5 rounded-none transition-all placeholder:text-[#a89f91]/30 font-sans tracking-wider"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-souls tracking-widest text-[#a89f91] ml-1 uppercase">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a89f91] group-focus-within:text-[#fdf5d3] transition-colors" size={20} />
                                <input
                                    type="email"
                                    placeholder="name@oath.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full bg-[#050505] border border-[#cbaa64]/20 py-4 pl-12 pr-4 text-[#e8dac1] focus:outline-none focus:border-[#cbaa64]/70 focus:bg-[#cbaa64]/5 rounded-none transition-all placeholder:text-[#a89f91]/30 font-sans tracking-wider"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-souls tracking-widest text-[#a89f91] ml-1 uppercase">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a89f91] group-focus-within:text-[#fdf5d3] transition-colors" size={20} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full bg-[#050505] border border-[#cbaa64]/20 py-4 pl-12 pr-12 text-[#e8dac1] focus:outline-none focus:border-[#cbaa64]/70 focus:bg-[#cbaa64]/5 rounded-none transition-all placeholder:text-[#a89f91]/30 font-sans tracking-widest"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a89f91] hover:text-[#fdf5d3] transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-md border border-[#cbaa64]/30 bg-[#050505]/50 hover:bg-[#cbaa64]/10 hover:border-[#cbaa64]/80 text-[#cbaa64] font-souls text-xl tracking-[0.2em] transition-all shadow-inner active:scale-[0.98] disabled:opacity-50 disabled:scale-100 uppercase"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-4">
                                    <div className="w-3 h-3 rounded-full bg-[#fdf5d3] shadow-[0_0_15px_3px_rgba(203,170,100,0.6)] animate-pulse" />
                                    <span className="animate-pulse">Summoning...</span>
                                </div>
                            ) : (
                                isSignUp ? 'Initiate Oath' : 'Enter Chamber'
                            )}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-[#a89f91]">
                        {isSignUp ? (
                            <>
                                <span className="opacity-70 font-souls tracking-widest text-[#e8dac1]">ALREADY AN INITIATE?</span><br />
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        const audio = new Audio(navSound);
                                        audio.volume = 0.5;
                                        audio.play().catch(() => { });
                                        setIsSignUp(false);
                                    }}
                                    className="text-[#cbaa64] mt-2 font-souls text-lg tracking-[0.2em] hover:text-[#fdf5d3] transition-colors underline-offset-[6px] hover:underline"
                                >
                                    RETURN TO ORDER
                                </button>
                            </>
                        ) : (
                            <>
                                <span className="opacity-70 font-souls tracking-widest text-[#e8dac1]">NEW TO THE ORDER?</span><br />
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        const audio = new Audio(navSound);
                                        audio.volume = 0.5;
                                        audio.play();
                                        setIsSignUp(true);
                                    }}
                                    className="text-[#cbaa64] mt-2 font-souls text-lg tracking-[0.2em] hover:text-[#fdf5d3] transition-colors underline-offset-[6px] hover:underline"
                                >
                                    SWEAR THE OATH
                                </button>
                            </>
                        )}
                    </p>
                </div >
            </div >
        </div >
    );
};

export default AuthPage;

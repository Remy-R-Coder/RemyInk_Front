"use client"

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation"
import Link from "next/link";
import "./Home.scss";

const Home = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [guestSessionKey, setGuestSessionKey] = useState(null);
    const router = useRouter();

    useEffect(() => {
    const userString = localStorage.getItem("currentUser");
    if (userString) {
        try {
            const user = JSON.parse(userString);
            if (["CLIENT", "FREELANCER"].includes(user.role)) {
                setCurrentUser(user);
            }
        } catch (error) {
            console.error("Failed to parse user data from localStorage:", error);
        }
    }

    const existingSession = localStorage.getItem("guestSessionKey");
    if (existingSession) {
        setGuestSessionKey(existingSession);
           return;
    }

    const createGuestSession = async () => {
        try {
            // This will automatically use your DigitalOcean URL in production
            // and fall back to your local machine while you're coding.
            const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
            
            const res = await fetch(`${API_BASE}/api/users/csrf-and-session/`, {
                method: "GET",
                credentials: "include", 
            });
    
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
            const data = await res.json();
            const key = data.sessionId || data.session_key || data.sessionid;
    
            if (key) {
                localStorage.setItem("guestSessionKey", key);
                setGuestSessionKey(key);
            }
        } catch (err) {
            console.error("Guest session failed:", err);
        }
    };
    
    createGuestSession();

    }, []);
    const isClient = currentUser?.role === "CLIENT";
    const isFreelancer = currentUser?.role === "FREELANCER";


    const getDashboardPath = (role) => {
        switch (role) {
            case "CLIENT":
                return "/dashboard";
            case "FREELANCER":
                return "/dashboard";
            // case "ADMIN":
            //     return "/admin/dashboard";
            default:
                return "/";
        }
    };

    return (
        <div className="home">
            <section className="hero">
                <div className="hero-content"> 
                    <span className="badge">Premium Academic Support</span>
                    <h1 className="brand">
                        <span className="highlight">Tutoring & Academic Support</span> Platform
                    </h1>
                    <p className="tagline">
                        Get help from vetted experts through tutoring, proofreading, referencing and academic guidance.  
                    </p>
                    <p className="description">
                        We help you understand complex concepts and improve your academic skills with confidence, through live webinars, and tailored programs.
                    </p>
                    <div className="cta-buttons">
                        {/* 1. Show Dashboard for logged-in Freelancers */}
                        {isFreelancer && (
                            <Link href="/dashboard" className="btn primary">
                                Go to Dashboard →
                            </Link>
                        )}
                    
                        {/* 2. Show ONLY Browse Categories for Clients AND Guests */}
                        {(isClient || !currentUser) && (
                            <Link
                                href={
                                    guestSessionKey
                                        ? `/categories?session_key=${String(guestSessionKey)}`
                                        : "/categories"
                                }
                                className="btn primary"
                            >
                                Find Help →
                            </Link>
                        )}
                        
                        {/* "Get Started" link removed to maintain a single CTA focus */}
                    </div>
                </div>
            </section>

            <section className="value-strip">
                <div className="value-item">
                    <span className="value-icon">⭐</span>
                    <p className="value-text">4.9/5.0 Average Rating</p>
                </div>
                <div className="value-item">
                    <span className="value-icon">⚡</span>
                    <p className="value-text">Instant Access to Academic Support</p>
                </div>
                <div className="value-item">
                    <span className="value-icon">🔒</span>
                    <p className="value-text">Secure & Private Learning Support</p>
                </div>
            </section>

            <section className="features">
                <h2 className="section-title">The Foundation of Trust</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <span className="icon">📝</span>
                        <h3>Personalized Learning Support</h3>
                        <p>Receive personalized explanations and feedback designed to help you produce your own high-quality work.</p>
                    </div>
                    <div className="feature-card">
                        <span className="icon">🎓</span>
                        <h3>Vetted Specialists</h3>
                        <p>Work with qualified specialists selected for subject knowledge and teaching ability.</p>
                    </div>
                    <div className="feature-card">
                        <span className="icon">💬</span>
                        <h3>Direct Communication</h3>
                        <p>Chat directly with experts to ask questions, review concepts, and get clarity in real time.</p>
                    </div>
                    <div className="feature-card">
                        <span className="icon">✅</span>
                        <h3>Editing & Feedback</h3>
                        <p>Improve your own work with professional proofreading and constructive feedback.</p>
                    </div>
                </div>
            </section>
            
            <section className="client-testimonials">
                <h2 className="section-title">Trusted Globally</h2>
                <div className="testimonial-grid">
                    <div className="testimonial-card">
                        <p className="quote">“The guidance helped me understand my topic much better and improve my final submission.”</p>
                        <p className="author">— Alex P., Master's Student</p>
                    </div>
                    <div className="testimonial-card">
                        <p className="quote">“My tutor explained complex concepts clearly. I finally felt confident tackling my research.”</p>
                        <p className="author">— Dr. Fatima E., Researcher</p>
                    </div>
                    <div className="testimonial-card">
                        <p className="quote">“The direct chat feature made the whole process stress-free. Fast response and exceptional support, 24/7.”</p>
                        <p className="author">— Chris R., Undergraduate</p>
                    </div>
                </div>
            </section>

            <section className="final-cta">
                <div className="cta-content">
                    <h2>Ready to Improve Your Academic Performance?</h2>
                    <p>Get support from experts who help you learn, refine your work, and build confidence</p>
                    <p>All services are intended for academic support, guidance, and skill development only, and not as replacement for your own work.</p>
                    <Link
                        href={guestSessionKey ? `/categories?session_key=${String(guestSessionKey)}` : "/categories"}
                        className="btn primary large-cta-btn"
                    >
                        Start Learning →
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default Home;

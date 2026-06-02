/**
 * Animated Background Component
 * 
 * Creates beautiful, dynamic animated backgrounds that respond to
 * the emotional state and context of the decision
 */

import { useEffect, useRef } from 'react';
import './AnimatedBackground.css';

export default function AnimatedBackground({ emotionalScore = 50, theme = 'default' }) {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const particlesRef = useRef([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const resetParticle = (particle) => {
            particle.x = Math.random() * canvas.width;
            particle.y = Math.random() * canvas.height;
            particle.size = Math.random() * 3 + 1;
            particle.speedX = (Math.random() - 0.5) * 0.5;
            particle.speedY = (Math.random() - 0.5) * 0.5;
            particle.opacity = Math.random() * 0.5 + 0.2;

            // Color based on emotional score
            if (emotionalScore > 70) {
                // Warm, energetic colors
                particle.hue = Math.random() * 60 + 340; // Reds and oranges
            } else if (emotionalScore < 30) {
                // Cool, calm colors
                particle.hue = Math.random() * 60 + 180; // Blues and cyans
            } else {
                // Balanced purples and blues
                particle.hue = Math.random() * 60 + 220; // Purples
            }

            particle.saturation = 70 + Math.random() * 30;
            particle.lightness = 50 + Math.random() * 20;
        };

        const createParticle = () => {
            const particle = {};
            resetParticle(particle);
            return particle;
        };

        const updateParticle = (particle) => {
            particle.x += particle.speedX;
            particle.y += particle.speedY;

            // Wrap around edges
            if (particle.x < 0) particle.x = canvas.width;
            if (particle.x > canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = canvas.height;
            if (particle.y > canvas.height) particle.y = 0;

            // Pulse effect
            particle.opacity = 0.3 + Math.sin(Date.now() * 0.001 + particle.x) * 0.2;
        };

        const drawParticle = (particle) => {
            ctx.fillStyle = `hsla(${particle.hue}, ${particle.saturation}%, ${particle.lightness}%, ${particle.opacity})`;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        };

        // Initialize particles
        const particleCount = Math.min(Math.floor((canvas.width * canvas.height) / 15000), 100);
        particlesRef.current = Array.from({ length: particleCount }, () => createParticle());

        // Gradient waves
        let waveOffset = 0;

        const animate = () => {
            // Create gradient background
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);

            if (emotionalScore > 70) {
                // Warm gradient for high emotion
                gradient.addColorStop(0, '#1a0a1f');
                gradient.addColorStop(0.5, '#2d1b3d');
                gradient.addColorStop(1, '#3d1f2f');
            } else if (emotionalScore < 30) {
                // Cool gradient for low emotion
                gradient.addColorStop(0, '#0a1628');
                gradient.addColorStop(0.5, '#1a2642');
                gradient.addColorStop(1, '#1f2d3d');
            } else {
                // Balanced gradient
                gradient.addColorStop(0, '#0f0a1f');
                gradient.addColorStop(0.5, '#1a1535');
                gradient.addColorStop(1, '#1f1a2e');
            }

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw animated waves
            waveOffset += 0.005;
            const waveCount = 3;

            for (let i = 0; i < waveCount; i++) {
                ctx.beginPath();
                ctx.moveTo(0, canvas.height / 2);

                for (let x = 0; x < canvas.width; x++) {
                    const y = canvas.height / 2 +
                        Math.sin(x * 0.01 + waveOffset + i) * 30 +
                        Math.sin(x * 0.005 + waveOffset * 2) * 20;
                    ctx.lineTo(x, y);
                }

                ctx.lineTo(canvas.width, canvas.height);
                ctx.lineTo(0, canvas.height);
                ctx.closePath();

                const waveHue = emotionalScore > 70 ? 340 : emotionalScore < 30 ? 220 : 260;
                ctx.fillStyle = `hsla(${waveHue}, 60%, 40%, ${0.03 + i * 0.02})`;
                ctx.fill();
            }

            // Update and draw particles
            particlesRef.current.forEach(particle => {
                updateParticle(particle);
                drawParticle(particle);
            });

            // Draw connections between nearby particles
            ctx.strokeStyle = `rgba(150, 150, 255, 0.1)`;
            ctx.lineWidth = 0.5;

            for (let i = 0; i < particlesRef.current.length; i++) {
                for (let j = i + 1; j < particlesRef.current.length; j++) {
                    const dx = particlesRef.current[i].x - particlesRef.current[j].x;
                    const dy = particlesRef.current[i].y - particlesRef.current[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 150) {
                        ctx.beginPath();
                        ctx.moveTo(particlesRef.current[i].x, particlesRef.current[i].y);
                        ctx.lineTo(particlesRef.current[j].x, particlesRef.current[j].y);
                        ctx.globalAlpha = (150 - distance) / 150 * 0.2;
                        ctx.stroke();
                        ctx.globalAlpha = 1;
                    }
                }
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        const handleVisibility = () => {
            if (document.hidden) {
                if (animationRef.current) cancelAnimationFrame(animationRef.current);
            } else {
                animate();
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            document.removeEventListener('visibilitychange', handleVisibility);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [emotionalScore, theme]);

    return (
        <canvas
            ref={canvasRef}
            className="animated-background-canvas"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: -1,
                pointerEvents: 'none'
            }}
        />
    );
}

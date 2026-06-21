import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../lib/auth.js';
import Nav from '../components/landing/Nav.jsx';
import Hero from '../components/landing/Hero.jsx';
import Features from '../components/landing/Features.jsx';
import BotSection from '../components/landing/BotSection.jsx';
import Pricing from '../components/landing/Pricing.jsx';
import Footer from '../components/landing/Footer.jsx';
import LoginModal from '../components/landing/LoginModal.jsx';

export default function Landing() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  // Si ya hay sesión (JWT válido en localStorage) → al dashboard.
  useEffect(() => {
    if (isAuthenticated()) navigate('/app', { replace: true });
  }, [navigate]);

  const openModal = () => setModalOpen(true);

  return (
    <>
      <Nav onLogin={openModal} />
      <Hero onCta={openModal} />
      <Features />
      <BotSection />
      <Pricing onFree={openModal} onPro={openModal} />
      <Footer />
      <LoginModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

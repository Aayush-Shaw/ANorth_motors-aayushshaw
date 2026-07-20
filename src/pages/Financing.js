import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Check, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useTheme } from '../contexts/ThemeContext';

const SAFE_ICON = (Icon, props = {}) => {
  if (!Icon || (typeof Icon !== 'function' && typeof Icon !== 'object')) return null;
  return <Icon {...props} />;
};

const API = (process.env.REACT_APP_BACKEND_URL || '') + '/api';

export default function Financing() {
  const { theme } = useTheme();
  const [calc, setCalc] = useState({ price: 35000, down: 5000, term: 60, rate: 6.99 });
  const [form, setForm] = useState({ name: '', email: '', phone: '', employment: '', annual_income: '', down_payment: '' });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const stepValue = (key, step, min, max, direction) => {
    setCalc((prev) => {
      const raw = prev[key] + step * direction;
      const clamped = Math.min(max, Math.max(min, raw));
      return { ...prev, [key]: Math.round(clamped * 100) / 100 };
    });
  };

  const principal = Math.max(0, calc.price - calc.down);
  const monthlyRate = calc.rate / 100 / 12;
  const monthlyPayment = monthlyRate > 0
    ? (principal * monthlyRate * Math.pow(1 + monthlyRate, calc.term)) / (Math.pow(1 + monthlyRate, calc.term) - 1)
    : principal / calc.term;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await axios.post(`${API}/leads`, {
        lead_type: 'financing',
        name: form.name,
        email: form.email,
        phone: form.phone,
        message: `Employment: ${form.employment}. Annual income: $${form.annual_income}`,
        down_payment: form.down_payment ? parseFloat(form.down_payment) : undefined,
      });
      setSubmitted(true);
    } catch (err) { console.error(err); }
    finally { setSending(false); }
  };

  return (
    <>
      <Helmet>
        <title>Vehicle Financing & Auto Loans Edmonton | AutoNorth Motors</title>
        <meta name="description" content="Get pre-approved for a car loan in Edmonton today. AutoNorth Motors offers competitive financing rates for all credit profiles in Alberta. Low APR, flexible terms, and instant decisions." />
        <meta name="keywords" content="car loans Edmonton, auto financing Alberta, bad credit car loans Edmonton, vehicle finance rates Canada, AutoNorth Motors financing" />
      </Helmet>

      <div className="bg-[var(--bg-page)] min-h-screen flex flex-col" data-testid="financing-page">
        <div className="relative flex-grow">
          {/* Background Image — dark mode only */}
          {theme === 'dark' && (
            <div 
              className="absolute inset-0 z-0 pointer-events-none bg-cover bg-center bg-fixed bg-no-repeat"
              style={{ backgroundImage: 'url(/clean_luxury_showroom_no_text_1777282813141.png)' }}
            >
              <div className="absolute inset-0 bg-[#050505]/90"></div>
            </div>
          )}
          <div className="relative z-50">
            <Navbar />
          </div>
          <div className="relative z-10 pt-32 pb-24 max-w-7xl mx-auto px-6 md:px-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16">
          <p className="text-xs tracking-[0.2em] uppercase text-[var(--text-gold)] font-heading mb-3">Financing</p>
          <h1 className="font-heading text-4xl md:text-5xl font-light text-[var(--text-primary)] tracking-tight mb-4">
            Your Road to <span className="gradient-text">Ownership</span>
          </h1>
              <p className="text-[var(--text-muted)] font-body text-lg max-w-xl leading-relaxed mb-8">
                Fast approvals, competitive rates, and flexible terms. We work with all credit profiles.
              </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Calculator */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <div className="glass-card p-4 sm:p-8 mb-6" data-testid="financing-calculator">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-[#D4AF37]/10 border border-[var(--border-gold)] flex items-center justify-center">
                  {SAFE_ICON(Calculator, { size: 18, className: "text-[var(--text-gold)]" })}
                </div>
                <h2 className="font-heading text-xl font-semibold text-[var(--text-primary)]">Payment Calculator</h2>
              </div>

              {[
                { label: 'Vehicle Price', key: 'price', min: 5000, max: 2000000, step: 1000, prefix: '$', value: calc.price, info: 'How much is your new vehicle? Include any known fees or surcharges. Do not include tax.' },
                { label: 'Down Payment', key: 'down', min: 0, max: calc.price, step: 500, prefix: '$', value: calc.down, info: "Enter the amount that you'll be paying for the vehicle in cash, upfront." },
                { label: 'Loan Term', key: 'term', min: 12, max: 96, step: 12, suffix: 'months', value: calc.term, info: 'The number of months you will take to pay off the loan.' },
                { label: 'Interest Rate', key: 'rate', min: 1, max: 30, step: 0.25, suffix: '%', value: calc.rate, info: 'The annual percentage rate (APR) for your loan.' },
              ].map((item) => (
                <div key={item.key} className="mb-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
                    <label className="flex items-center gap-2 text-[var(--text-muted)] text-sm font-body tracking-wider uppercase">
                      {item.label}
                      {item.info && (
                        <div className="relative group flex items-center">
                          <div className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-help transition-colors">
                            {SAFE_ICON(Info, { size: 14 })}
                          </div>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:left-full md:-translate-x-0 md:mb-0 md:ml-2 w-56 p-3 bg-[var(--bg-input)] border border-[var(--border-gold)] text-[var(--text-primary)] text-xs font-normal normal-case shadow-2xl rounded-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible pointer-events-none transition-all z-[999]">
                            {item.info}
                          </div>
                        </div>
                      )}
                    </label>
                    <div className="flex items-center bg-[var(--bg-input)] border border-[var(--border-card)] rounded-md px-3 py-2 focus-within:border-[#D4AF37]/50 focus-within:ring-1 focus-within:ring-[#D4AF37]/50 transition-all w-full sm:w-auto">
                      {item.prefix && <span className="text-[var(--text-muted)] text-sm font-medium mr-1">{item.prefix}</span>}
                      <input
                        type="number"
                        value={item.value}
                        onChange={(e) => {
                          const newVal = e.target.value;
                          setCalc((prev) => ({ ...prev, [item.key]: newVal === '' ? '' : Number(newVal) }));
                        }}
                        onBlur={(e) => {
                          let num = Number(e.target.value);
                          if (isNaN(num) || e.target.value === '') {
                            num = item.min;
                          } else {
                            num = Math.min(item.max, Math.max(item.min, num));
                          }
                          setCalc((prev) => ({ ...prev, [item.key]: num }));
                        }}
                        className="bg-transparent text-[var(--text-primary)] font-heading text-base font-semibold flex-1 sm:w-32 text-right focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      {item.suffix && <span className="text-[var(--text-muted)] text-sm font-medium ml-1">{item.suffix}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => stepValue(item.key, item.step, item.min, item.max, -1)}
                      disabled={item.value <= item.min}
                      aria-label={`Decrease ${item.label}`}
                      className={`w-8 h-8 flex-shrink-0 flex items-center justify-center border transition-all duration-200 ${
                        item.value <= item.min
                          ? 'bg-[var(--stepper-bg-disabled)] border-[var(--stepper-border-disabled)] text-[var(--stepper-text-disabled)] cursor-not-allowed'
                          : 'bg-[var(--stepper-bg)] border-[var(--stepper-border)] text-[var(--stepper-icon)] hover:border-[var(--stepper-border-hover)] hover:text-[var(--stepper-icon-hover)] hover:bg-[var(--stepper-bg-hover)] cursor-pointer'
                      }`}
                    >
                      {SAFE_ICON(ChevronLeft, { size: 14 })}
                    </button>
                    <input
                      type="range"
                      min={item.min}
                      max={item.max}
                      step={item.step}
                      value={item.value}
                      onChange={(e) => setCalc({ ...calc, [item.key]: parseFloat(e.target.value) })}
                      className="flex-1 h-2 rounded-full appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-[#D4AF37] [&::-webkit-slider-thumb]:rounded-full [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:bg-[#D4AF37] [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:rounded-full"
                      style={{
                        background: `linear-gradient(to right, #D4AF37 ${((item.value - item.min) / (item.max - item.min || 1)) * 100}%, var(--track-inactive) ${((item.value - item.min) / (item.max - item.min || 1)) * 100}%)`
                      }}
                      data-testid={`calc-${item.key}`}
                    />
                    <button
                      type="button"
                      onClick={() => stepValue(item.key, item.step, item.min, item.max, 1)}
                      disabled={item.value >= item.max}
                      aria-label={`Increase ${item.label}`}
                      className={`w-8 h-8 flex-shrink-0 flex items-center justify-center border transition-all duration-200 ${
                        item.value >= item.max
                          ? 'bg-[var(--stepper-bg-disabled)] border-[var(--stepper-border-disabled)] text-[var(--stepper-text-disabled)] cursor-not-allowed'
                          : 'bg-[var(--stepper-bg)] border-[var(--stepper-border)] text-[var(--stepper-icon)] hover:border-[var(--stepper-border-hover)] hover:text-[var(--stepper-icon-hover)] hover:bg-[var(--stepper-bg-hover)] cursor-pointer'
                      }`}
                    >
                      {SAFE_ICON(ChevronRight, { size: 14 })}
                    </button>
                  </div>
                  <div className="flex justify-between text-[var(--text-faint)] text-xs font-body mt-1">
                    <span>{item.prefix}{item.min.toLocaleString()}{item.suffix}</span>
                    <span>{item.prefix}{item.max.toLocaleString()}{item.suffix}</span>
                  </div>
                </div>
              ))}

              <div className="bg-[#D4AF37]/5 border border-[var(--border-gold)] p-6 text-center">
                <p className="text-[var(--text-muted)] text-xs tracking-widest uppercase font-heading mb-2">Estimated Monthly Payment</p>
                <p className="font-heading text-5xl font-bold text-[var(--text-gold)]" data-testid="monthly-payment">
                  ${isNaN(monthlyPayment) ? '0' : monthlyPayment.toFixed(0)}
                </p>
                <p className="text-[var(--text-muted)] text-sm font-body mt-2">/month for {calc.term} months</p>
                <p className="text-[var(--text-faint)] text-xs font-body mt-1">Principal: ${principal.toLocaleString()} · Rate: {calc.rate}% APR</p>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="font-heading text-base font-semibold text-[var(--text-primary)] mb-4">Why Finance with AutoNorth?</h3>
              <ul className="space-y-3">
                {['Competitive rates from 3.99% APR', 'Quick 10-minute pre-approval', 'All credit profiles welcome', 'Flexible terms 12-96 months', 'Trade-in accepted towards down payment'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-[var(--text-muted)] font-body text-base">
                    {SAFE_ICON(Check, { size: 14, className: "text-[#D4AF37] flex-shrink-0" })}
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Pre-Approval Form */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <div className="glass-card p-8" data-testid="pre-approval-form">
              <h2 className="font-heading text-2xl font-semibold text-[var(--text-primary)] mb-2">Get Pre-Approved Today</h2>
              <p className="text-[var(--text-muted)] font-body text-base mb-8">Complete the form below and receive a decision within hours.</p>

              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center mx-auto mb-4">
                    {SAFE_ICON(Check, { size: 24, className: "text-[#D4AF37]" })}
                  </div>
                  <h3 className="font-heading text-xl text-[var(--text-primary)] mb-2">Application Received!</h3>
                  <p className="text-[var(--text-muted)] text-sm font-body">Our finance team will contact you within 2-4 hours with your approval decision.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <input className="input-dark w-full px-4 py-3 text-sm font-body" placeholder="Full Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required data-testid="finance-name" />
                    </div>
                    <input type="email" className="input-dark px-4 py-3 text-sm font-body" placeholder="Email Address *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required data-testid="finance-email" />
                    <input type="tel" className="input-dark px-4 py-3 text-sm font-body" placeholder="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} data-testid="finance-phone" />
                  </div>

                  <select className="input-dark w-full px-4 py-3 text-sm font-body" value={form.employment} onChange={(e) => setForm({ ...form, employment: e.target.value })} data-testid="finance-employment">
                    <option value="">Employment Status</option>
                    {['Full-Time Employed', 'Part-Time Employed', 'Self-Employed', 'Retired', 'Student', 'Other'].map((opt) => <option key={opt}>{opt}</option>)}
                  </select>

                  <input type="number" className="input-dark w-full px-4 py-3 text-sm font-body" placeholder="Annual Income ($)" value={form.annual_income} onChange={(e) => setForm({ ...form, annual_income: e.target.value })} data-testid="finance-income" />

                  <input type="number" className="input-dark w-full px-4 py-3 text-sm font-body" placeholder="Down Payment Amount ($)" value={form.down_payment} onChange={(e) => setForm({ ...form, down_payment: e.target.value })} data-testid="finance-down" />

                  <button type="submit" disabled={sending} className="btn-gold w-full py-4 text-sm flex items-center justify-center gap-2" data-testid="finance-submit">
                    {sending ? 'Processing...' : 'Submit Pre-Approval Application'} {!sending && SAFE_ICON(ChevronRight, { size: 16 })}
                  </button>

                  <p className="text-[var(--text-faint)] text-xs font-body text-center">By submitting, you agree to be contacted by our finance team. Your information is secure and never shared.</p>
                </form>
              )}
            </div>
          </motion.div>
        </div>
          </div>
        </div>
        <div className="relative z-20">
          <Footer />
        </div>
      </div>
    </>
  );
}

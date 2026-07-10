import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  calculateAmountFinanced,
  buildPaymentFrequencyTable,
} from '../utils/loanCalculator';

const SAFE_ICON = (Icon, props = {}) => {
  if (!Icon || (typeof Icon !== 'function' && typeof Icon !== 'object')) return null;
  return <Icon {...props} />;
};

/** Currency formatter — $XX,XXX.XX */
const fmtCurrency = (n) =>
  '$' +
  Number(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function LoanCalculatorPage() {
  const [inputs, setInputs] = useState({
    price: 35000,
    tradeInValue: 0,
    existingLoanBalance: 0,
    downPayment: 5000,
    termMonths: 60,
    taxRate: 5,
    interestRate: 6.99,
  });

  const update = (key, raw) => setInputs((prev) => ({ ...prev, [key]: parseFloat(raw) }));

  /** Step a value up or down by `step`, clamped to [min, max], rounded to avoid float drift */
  const stepValue = (key, step, min, max, direction) => {
    setInputs((prev) => {
      const raw = prev[key] + step * direction;
      const clamped = Math.min(max, Math.max(min, raw));
      return { ...prev, [key]: Math.round(clamped * 100) / 100 };
    });
  };

  /* ---------- Slider field configs ---------- */
  const fields = [
    { label: 'Vehicle Price',           key: 'price',               min: 5000,  max: 200000,       step: 1000, prefix: '$' },
    { label: 'Trade-In Value',          key: 'tradeInValue',        min: 0,     max: 100000,       step: 500,  prefix: '$' },
    { label: 'Existing Loan Balance',   key: 'existingLoanBalance', min: 0,     max: 100000,       step: 500,  prefix: '$' },
    { label: 'Down Payment',            key: 'downPayment',         min: 0,     max: inputs.price,  step: 500,  prefix: '$' },
    { label: 'Loan Term',               key: 'termMonths',          min: 12,    max: 96,           step: 12,   suffix: ' months' },
    { label: 'Sales Tax (GST)',         key: 'taxRate',             min: 0,     max: 15,           step: 0.5,  suffix: '%' },
    { label: 'Interest Rate',           key: 'interestRate',        min: 0,     max: 30,           step: 0.25, suffix: '%' },
  ];

  /* ---------- Calculations (pure derivation, no useEffect) ---------- */
  const amountFinanced = calculateAmountFinanced({
    price: inputs.price,
    tradeInValue: inputs.tradeInValue,
    existingLoanBalance: inputs.existingLoanBalance,
    downPayment: inputs.downPayment,
    taxRate: inputs.taxRate,
  });

  const frequencyTable = buildPaymentFrequencyTable(
    amountFinanced,
    inputs.interestRate,
    inputs.termMonths,
  );

  /* ---------- Render ---------- */
  return (
    <>
      <Helmet>
        <title>Auto Loan Calculator | AutoNorth Motors</title>
        <meta
          name="description"
          content="Estimate your monthly, bi-weekly, or weekly auto loan payments with AutoNorth Motors' free calculator. Serving Edmonton and all of Alberta with competitive car financing."
        />
        <meta
          name="keywords"
          content="auto loan calculator Edmonton, car payment estimator Alberta, vehicle financing calculator Canada, AutoNorth Motors loan"
        />
      </Helmet>

      <div className="bg-[#050505] min-h-screen" data-testid="loan-calculator-page">
        <Navbar />

        <div className="pt-32 pb-24 max-w-7xl mx-auto px-6 md:px-12">
          {/* ── Hero heading ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16">
            <p className="text-xs tracking-[0.2em] uppercase text-[#D4AF37] font-heading mb-3">
              Loan Calculator
            </p>
            <h1 className="font-heading text-4xl md:text-5xl font-light text-white tracking-tight mb-4">
              Estimate Your <span className="gradient-text">Payments</span>
            </h1>
            <p className="text-white/50 font-body text-lg max-w-xl leading-relaxed mb-8">
              Adjust the sliders below to see how price, down payment, trade-in, and
              interest rate affect your auto loan. No personal info required&nbsp;—
              just instant numbers.
            </p>
          </motion.div>

          {/* ── Slider panel ── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-3xl mx-auto"
          >
            <div className="glass-card p-8 mb-10" data-testid="loan-calc-sliders">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
                  {SAFE_ICON(Calculator, { size: 18, className: 'text-[#D4AF37]' })}
                </div>
                <h2 className="font-heading text-xl font-semibold text-white">Payment Calculator</h2>
              </div>

              {fields.map((item) => {
                const val = inputs[item.key];
                return (
                  <div key={item.key} className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-white/50 text-sm font-body tracking-wider uppercase">
                        {item.label}
                      </label>
                      <span className="text-white font-heading text-base font-semibold">
                        {item.prefix}
                        {typeof val === 'number' ? val.toLocaleString() : val}
                        {item.suffix}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => stepValue(item.key, item.step, item.min, item.max, -1)}
                        disabled={val <= item.min}
                        aria-label={`Decrease ${item.label}`}
                        className={`w-8 h-8 flex-shrink-0 flex items-center justify-center border transition-all duration-200 ${
                          val <= item.min
                            ? 'bg-white/[0.02] border-white/5 text-white/15 cursor-not-allowed'
                            : 'bg-white/[0.04] border-white/10 text-[#D4AF37]/70 hover:border-[#D4AF37]/40 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5 cursor-pointer'
                        }`}
                      >
                        {SAFE_ICON(ChevronLeft, { size: 14 })}
                      </button>
                      <input
                        type="range"
                        min={item.min}
                        max={item.max}
                        step={item.step}
                        value={val}
                        onChange={(e) => update(item.key, e.target.value)}
                        className="flex-1 h-1 bg-white/10 appearance-none cursor-pointer"
                        style={{ accentColor: '#D4AF37' }}
                        data-testid={`loan-calc-${item.key}`}
                      />
                      <button
                        type="button"
                        onClick={() => stepValue(item.key, item.step, item.min, item.max, 1)}
                        disabled={val >= item.max}
                        aria-label={`Increase ${item.label}`}
                        className={`w-8 h-8 flex-shrink-0 flex items-center justify-center border transition-all duration-200 ${
                          val >= item.max
                            ? 'bg-white/[0.02] border-white/5 text-white/15 cursor-not-allowed'
                            : 'bg-white/[0.04] border-white/10 text-[#D4AF37]/70 hover:border-[#D4AF37]/40 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5 cursor-pointer'
                        }`}
                      >
                        {SAFE_ICON(ChevronRight, { size: 14 })}
                      </button>
                    </div>
                    <div className="flex justify-between text-white/20 text-xs font-body mt-1">
                      <span>
                        {item.prefix}
                        {item.min.toLocaleString()}
                        {item.suffix}
                      </span>
                      <span>
                        {item.prefix}
                        {item.max.toLocaleString()}
                        {item.suffix}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Amount Financed callout ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="glass-card p-8 mb-10"
              data-testid="loan-calc-financed"
            >
              <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 p-6 text-center">
                <p className="text-white/40 text-xs tracking-widest uppercase font-heading mb-2">
                  Total Amount to Be Financed
                </p>
                <p className="font-heading text-2xl sm:text-4xl md:text-5xl font-bold text-[#D4AF37] break-words" data-testid="loan-calc-amount">
                  {fmtCurrency(amountFinanced)}
                </p>
                <p className="text-white/40 text-sm font-body mt-2">
                  {inputs.interestRate}% APR · {inputs.termMonths} months
                </p>
              </div>
            </motion.div>

            {/* ── Frequency table ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="glass-card p-8 mb-10"
              data-testid="loan-calc-table"
            >
              <h3 className="font-heading text-xl font-semibold text-white mb-6">
                Payment Breakdown
              </h3>

              {/* ── Mobile: stacked cards (< md) ── */}
              <div className="space-y-4 md:hidden">
                {frequencyTable.map((row) => (
                  <div
                    key={row.key}
                    className="bg-white/[0.03] border border-white/5 p-5"
                    data-testid={`loan-calc-freq-${row.key}`}
                  >
                    <p className="font-heading text-sm font-semibold text-white tracking-wider uppercase mb-4">
                      {row.label}
                    </p>
                    <div className="flex justify-between items-end mb-3">
                      <span className="text-white/40 text-xs tracking-widest uppercase font-heading">
                        Payment
                      </span>
                      <span className="text-[#D4AF37] font-heading text-xl font-semibold">
                        {fmtCurrency(row.payment)}
                      </span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-white/40 text-xs tracking-widest uppercase font-heading">
                        Total Interest
                      </span>
                      <span className="text-white/50 font-body text-base">
                        {fmtCurrency(row.totalInterest)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Desktop: 3-column table (md+) ── */}
              <div className="hidden md:block">
                {/* Table header */}
                <div className="grid grid-cols-3 gap-4 mb-3 px-2">
                  <span className="text-white/40 text-xs tracking-widest uppercase font-heading">
                    Frequency
                  </span>
                  <span className="text-white/40 text-xs tracking-widest uppercase font-heading text-right">
                    Payment
                  </span>
                  <span className="text-white/40 text-xs tracking-widest uppercase font-heading text-right">
                    Total Interest
                  </span>
                </div>

                {/* Table rows */}
                {frequencyTable.map((row) => (
                  <div
                    key={row.key}
                    className="grid grid-cols-3 gap-4 py-4 px-2 border-t border-white/5"
                    data-testid={`loan-calc-freq-desktop-${row.key}`}
                  >
                    <span className="text-white font-body text-base">{row.label}</span>
                    <span className="text-[#D4AF37] font-heading text-base font-semibold text-right">
                      {fmtCurrency(row.payment)}
                    </span>
                    <span className="text-white/50 font-body text-base text-right">
                      {fmtCurrency(row.totalInterest)}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ── CTA ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="text-center"
            >
              <Link
                to="/financing"
                className="btn-gold inline-flex items-center gap-2 px-10 py-4 text-sm"
                data-testid="loan-calc-cta"
              >
                Get Pre-Approved {SAFE_ICON(ChevronRight, { size: 16 })}
              </Link>
              <p className="text-white/25 text-xs font-body mt-4">
                Ready to make it official? Apply on our Financing page — fast approvals, all credit profiles welcome.
              </p>
            </motion.div>
          </motion.div>
        </div>

        <Footer />
      </div>
    </>
  );
}

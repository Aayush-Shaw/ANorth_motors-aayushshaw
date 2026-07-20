import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, ChevronLeft, ChevronRight, AlertTriangle, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useTheme } from '../contexts/ThemeContext';
import {
  calculateAmountFinanced,
  buildPaymentFrequencyTable,
  calculateMaxLoan,
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
  const { theme } = useTheme();
  const [mode, setMode] = useState('price'); // 'price' | 'payment'

  const [inputs, setInputs] = useState({
    price: 35000,
    targetPayment: 600,
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

  /* ---------- Field configs — top field swaps based on mode, rest are shared ---------- */
  const topField =
    mode === 'price'
      ? { label: 'Vehicle Price', key: 'price', min: 5000, max: 500000, step: 1000, prefix: '$', info: 'How much is your new vehicle? Include any known fees or surcharges. Do not include tax.' }
      : { label: 'Target Monthly Payment', key: 'targetPayment', min: 50, max: 5000, step: 25, prefix: '$', info: 'The monthly payment amount you are aiming for.' };

  const sharedFields = [
    { label: 'Trade-In Value', key: 'tradeInValue', min: 0, max: mode === 'price' ? Math.max(0, Math.min(200000, inputs.price - 20000)) : 200000, step: 500, prefix: '$', info: 'The estimated value of your current vehicle if you plan to trade it in.' },
    { label: 'Existing Loan Balance', key: 'existingLoanBalance', min: 0, max: 100000, step: 500, prefix: '$', info: 'The amount you still owe on your current vehicle, if any.' },
    {
      label: 'Down Payment',
      key: 'downPayment',
      min: 0,
      max: mode === 'price' ? inputs.price : 100000,
      step: 500,
      prefix: '$',
      info: "Enter the amount that you'll be paying for the vehicle in cash, upfront."
    },
    { label: 'Loan Term', key: 'termMonths', min: 12, max: 96, step: 12, suffix: ' months', info: 'The number of months you will take to pay off the loan.' },
    { label: 'Sales Tax (GST)', key: 'taxRate', min: 0, max: 15, step: 0.5, suffix: '%', info: 'The sales tax rate in your province (e.g. 5% for GST in Alberta).' },
    { label: 'Interest Rate', key: 'interestRate', min: 0, max: 30, step: 0.25, suffix: '%', info: 'The annual percentage rate (APR) for your loan.' },
  ];

  const fields = [topField, ...sharedFields];

  /* ---------- Live validation — maps errors to specific field keys ---------- */
  const getFieldErrors = () => {
    const errors = {};

    if (inputs.interestRate === undefined || inputs.interestRate === null || Number.isNaN(inputs.interestRate) || inputs.interestRate < 0) {
      errors.interestRate = 'Please enter a valid interest rate (0% or higher).';
    }
    if (!inputs.termMonths || inputs.termMonths <= 0) {
      errors.termMonths = 'Please select a loan term greater than 0 months.';
    }
    if (inputs.downPayment === 0) {
      errors.downPayment = "We don't accept $0 down payment in our company.";
    }

    if (mode === 'price' && !errors.interestRate && !errors.termMonths) {
      const maxTradeIn = Math.min(200000, inputs.price - 20000);
      if (inputs.tradeInValue > maxTradeIn) {
        errors.tradeInValue = `Your trade-in value cannot exceed $${Math.max(0, maxTradeIn).toLocaleString()} (Vehicle Price - $20,000, capped at $200,000).`;
      }

      const financed = calculateAmountFinanced(inputs);
      if (financed <= 0) {
        // Only show this generic error if we haven't already flagged trade-in or down payment
        if (!errors.downPayment && !errors.tradeInValue) {
          errors.downPayment =
            "Your trade-in and down payment exceed the vehicle price. We can't calculate a payment based on the numbers provided.";
        }
      } else if (financed < 5000) {
        if (!errors.downPayment && !errors.tradeInValue) {
          errors.downPayment = `The amount to be financed is below our minimum loan amount of $${(5000).toLocaleString()}.`;
        }
      }
    }

    if (mode === 'payment' && !errors.interestRate && !errors.termMonths) {
      if (!inputs.targetPayment || inputs.targetPayment <= 0) {
        errors.targetPayment = 'Please enter a target payment greater than $0.';
      } else {
        const { maxFinanced, targetPrice } = calculateMaxLoan(inputs);
        if (maxFinanced <= 0 || targetPrice <= 0) {
          errors.targetPayment =
            "We can't calculate your maximum loan amount based on the numbers provided. Please try again.";
        } else if (maxFinanced < 5000) {
          errors.targetPayment = `This payment amount finances less than our minimum loan amount of $${(5000).toLocaleString()}.`;
        }
      }
    }

    return errors;
  };

  const fieldErrors = getFieldErrors();
  const hasErrors = Object.keys(fieldErrors).length > 0;

  /* ---------- Calculations (pure derivation, no useEffect) ---------- */
  const amountFinanced = mode === 'price' ? calculateAmountFinanced(inputs) : 0;

  const frequencyTable =
    mode === 'price' && !hasErrors
      ? buildPaymentFrequencyTable(amountFinanced, inputs.interestRate, inputs.termMonths)
      : [];

  const maxLoanResult = mode === 'payment' && !hasErrors ? calculateMaxLoan(inputs) : null;

  /* ---------- Render ---------- */
  return (
    <>
      <Helmet>
        <title>Auto Loan Calculator | AutoNorth Motors</title>
        <meta
          name="description"
          content="Estimate your monthly, bi-weekly, or weekly auto loan payments — or find your maximum affordable vehicle price — with AutoNorth Motors' free calculator. Serving Edmonton and all of Alberta with competitive car financing."
        />
        <meta
          name="keywords"
          content="auto loan calculator Edmonton, car payment estimator Alberta, vehicle financing calculator Canada, AutoNorth Motors loan"
        />
      </Helmet>

      <div className="bg-[var(--bg-page)] min-h-screen flex flex-col" data-testid="loan-calculator-page">
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
            {/* ── Hero heading ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16">
              <p className="text-xs tracking-[0.2em] uppercase text-[var(--text-gold)] font-heading mb-3">
                Auto Loan Calculator
              </p>
              <h1 className="font-heading text-4xl md:text-5xl font-light text-[var(--text-primary)] tracking-tight mb-4">
                Estimate Your <span className="gradient-text">Payments</span>
              </h1>
              <p className="text-[var(--text-muted)] font-body text-lg max-w-xl leading-relaxed mb-8">
                Adjust the sliders below to see how price, down payment, trade-in, and
                interest rate affect your auto loan. No personal info required&nbsp;—
                just instant numbers.
              </p>
            </motion.div>

            {/* ── Calculator panel ── */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-3xl mx-auto"
            >
              <div className="glass-card p-4 sm:p-8 mb-10" data-testid="loan-calc-sliders">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-[#D4AF37]/10 border border-[var(--border-gold)] flex items-center justify-center">
                    {SAFE_ICON(Calculator, { size: 18, className: 'text-[var(--text-gold)]' })}
                  </div>
                  <h2 className="font-heading text-xl font-semibold text-[var(--text-primary)]">Auto Loan Calculator</h2>
                </div>

                {/* ── Mode toggle ── */}
                <div
                  className="grid grid-cols-2 gap-1 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-md p-1 mb-8"
                  data-testid="loan-calc-mode-toggle"
                >
                  <button
                    type="button"
                    onClick={() => setMode('price')}
                    className={`py-2.5 text-xs font-heading tracking-wider uppercase rounded-sm transition-all ${
                      mode === 'price'
                        ? 'bg-[#D4AF37] text-black font-semibold'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                    data-testid="loan-calc-mode-price"
                  >
                    I Know My Price
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('payment')}
                    className={`py-2.5 text-xs font-heading tracking-wider uppercase rounded-sm transition-all ${
                      mode === 'payment'
                        ? 'bg-[#D4AF37] text-black font-semibold'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                    data-testid="loan-calc-mode-payment"
                  >
                    I Know My Budget
                  </button>
                </div>

                {fields.map((item) => {
                  const val = inputs[item.key];
                  const fieldError = fieldErrors[item.key];
                  return (
                    <div key={item.key} className="mb-6">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
                        <label className="flex items-center gap-2 text-[var(--text-primary)] font-medium text-sm font-body tracking-wider uppercase">
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
                            value={val}
                            onChange={(e) => {
                              const newVal = e.target.value;
                              setInputs((prev) => ({ ...prev, [item.key]: newVal === '' ? '' : Number(newVal) }));
                            }}
                            onBlur={(e) => {
                              let num = Number(e.target.value);
                              if (isNaN(num) || e.target.value === '') {
                                num = item.min;
                              } else {
                                if (item.key === 'tradeInValue' || item.key === 'downPayment') {
                                  // Don't clamp max for these fields so that validation errors can trigger and be seen
                                  num = Math.max(item.min, num);
                                } else {
                                  num = Math.min(item.max, Math.max(item.min, num));
                                }
                              }
                              setInputs((prev) => ({ ...prev, [item.key]: num }));
                            }}
                            className="bg-transparent text-[var(--text-primary)] font-heading text-base font-semibold flex-1 min-w-0 sm:w-32 text-right focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          {item.suffix && <span className="text-[var(--text-muted)] text-sm font-medium ml-1 flex-shrink-0 whitespace-nowrap">{item.suffix}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => stepValue(item.key, item.step, item.min, item.max, -1)}
                          disabled={val <= item.min}
                          aria-label={`Decrease ${item.label}`}
                          className={`w-8 h-8 flex-shrink-0 flex items-center justify-center border transition-all duration-200 ${
                            val <= item.min
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
                          value={val}
                          onChange={(e) => update(item.key, e.target.value)}
                          className="flex-1 h-2 rounded-full appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-[#D4AF37] [&::-webkit-slider-thumb]:rounded-full [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:bg-[#D4AF37] [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:rounded-full"
                          style={{
                            background: `linear-gradient(to right, ${fieldError ? 'var(--error-border)' : '#D4AF37'} ${((val - item.min) / (item.max - item.min)) * 100}%, var(--track-inactive) ${((val - item.min) / (item.max - item.min)) * 100}%)`,
                          }}
                          data-testid={`loan-calc-${item.key}`}
                        />
                        <button
                          type="button"
                          onClick={() => stepValue(item.key, item.step, item.min, item.max, 1)}
                          disabled={val >= item.max}
                          aria-label={`Increase ${item.label}`}
                          className={`w-8 h-8 flex-shrink-0 flex items-center justify-center border transition-all duration-200 ${
                            val >= item.max
                              ? 'bg-[var(--stepper-bg-disabled)] border-[var(--stepper-border-disabled)] text-[var(--stepper-text-disabled)] cursor-not-allowed'
                              : 'bg-[var(--stepper-bg)] border-[var(--stepper-border)] text-[var(--stepper-icon)] hover:border-[var(--stepper-border-hover)] hover:text-[var(--stepper-icon-hover)] hover:bg-[var(--stepper-bg-hover)] cursor-pointer'
                          }`}
                        >
                          {SAFE_ICON(ChevronRight, { size: 14 })}
                        </button>
                      </div>
                      <div className="flex justify-between text-[var(--text-faint)] text-xs font-body mt-1">
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
                      {/* ── Inline error for this specific slider ── */}
                      {fieldError && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 mt-2 px-3 py-2 bg-[var(--error-bg)] border border-[var(--error-border)] rounded-md"
                          data-testid={`loan-calc-error-${item.key}`}
                        >
                          {SAFE_ICON(AlertTriangle, { size: 14, className: 'text-[var(--error-text)] flex-shrink-0' })}
                          <p className="text-[var(--error-text)] text-xs font-body">{fieldError}</p>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ── Mode A: Amount Financed + Payment Breakdown ── */}
              {!hasErrors && mode === 'price' && (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="glass-card p-8 mb-10"
                    data-testid="loan-calc-financed"
                  >
                    <div className="bg-[#D4AF37]/5 border border-[var(--border-gold)] p-6 text-center">
                      <p className="text-[var(--text-muted)] text-xs tracking-widest uppercase font-heading mb-2">
                        Total Amount to Be Financed
                      </p>
                      <p className="font-heading text-2xl sm:text-4xl md:text-5xl font-bold text-[var(--text-gold)] break-words" data-testid="loan-calc-amount">
                        {fmtCurrency(amountFinanced)}
                      </p>
                      <p className="text-[var(--text-muted)] text-sm font-body mt-2">
                        {inputs.interestRate}% APR · {inputs.termMonths} months
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="glass-card p-8 mb-10"
                    data-testid="loan-calc-table"
                  >
                    <h3 className="font-heading text-xl font-semibold text-[var(--text-primary)] mb-6">
                      Payment Breakdown
                    </h3>

                    {/* ── Mobile: stacked cards (< md) ── */}
                    <div className="space-y-4 md:hidden">
                      {frequencyTable.map((row) => (
                        <div
                          key={row.key}
                          className="bg-[var(--bg-card)] border border-[var(--border-card)] p-5"
                          data-testid={`loan-calc-freq-${row.key}`}
                        >
                          <p className="font-heading text-sm font-semibold text-[var(--text-primary)] tracking-wider uppercase mb-4">
                            {row.label}
                          </p>
                          <div className="flex justify-between items-end mb-3">
                            <span className="text-[var(--text-muted)] text-xs tracking-widest uppercase font-heading">
                              Payment
                            </span>
                            <span className="text-[var(--text-gold)] font-heading text-xl font-semibold">
                              {fmtCurrency(row.payment)}
                            </span>
                          </div>
                          <div className="flex justify-between items-end">
                            <span className="text-[var(--text-muted)] text-xs tracking-widest uppercase font-heading">
                              Total Interest
                            </span>
                            <span className="text-[var(--text-muted)] font-body text-base">
                              {fmtCurrency(row.totalInterest)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* ── Desktop: 3-column table (md+) ── */}
                    <div className="hidden md:block">
                      <div className="grid grid-cols-3 gap-4 mb-3 px-2">
                        <span className="text-[var(--text-muted)] text-xs tracking-widest uppercase font-heading">
                          Frequency
                        </span>
                        <span className="text-[var(--text-muted)] text-xs tracking-widest uppercase font-heading text-right">
                          Payment
                        </span>
                        <span className="text-[var(--text-muted)] text-xs tracking-widest uppercase font-heading text-right">
                          Total Interest
                        </span>
                      </div>

                      {frequencyTable.map((row) => (
                        <div
                          key={row.key}
                          className="grid grid-cols-3 gap-4 py-4 px-2 border-t border-[var(--border-card)]"
                          data-testid={`loan-calc-freq-desktop-${row.key}`}
                        >
                          <span className="text-[var(--text-primary)] font-body text-base">{row.label}</span>
                          <span className="text-[var(--text-gold)] font-heading text-base font-semibold text-right">
                            {fmtCurrency(row.payment)}
                          </span>
                          <span className="text-[var(--text-muted)] font-body text-base text-right">
                            {fmtCurrency(row.totalInterest)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}

              {/* ── Mode B: Max Vehicle Price ── */}
              {!hasErrors && mode === 'payment' && maxLoanResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="glass-card p-8 mb-10"
                  data-testid="loan-calc-max-price"
                >
                  <div className="bg-[#D4AF37]/5 border border-[var(--border-gold)] p-6 text-center mb-6">
                    <p className="text-[var(--text-muted)] text-xs tracking-widest uppercase font-heading mb-2">
                      Target Vehicle Price (with tax)
                    </p>
                    <p className="font-heading text-2xl sm:text-4xl md:text-5xl font-bold text-[var(--text-gold)] break-words" data-testid="loan-calc-target-price">
                      {fmtCurrency(maxLoanResult.targetPrice)}
                    </p>
                    <p className="text-[var(--text-muted)] text-sm font-body mt-2">
                      {inputs.interestRate}% APR · {inputs.termMonths} months
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-card)] p-5 text-center">
                      <p className="text-[var(--text-muted)] text-xs tracking-widest uppercase font-heading mb-2">
                        Amount Financed
                      </p>
                      <p className="text-[var(--text-gold)] font-heading text-lg font-semibold">
                        {fmtCurrency(maxLoanResult.maxFinanced)}
                      </p>
                    </div>
                    <div className="bg-[var(--bg-card)] border border-[var(--border-card)] p-5 text-center">
                      <p className="text-[var(--text-muted)] text-xs tracking-widest uppercase font-heading mb-2">
                        Total Interest
                      </p>
                      <p className="text-[var(--text-gold)] font-heading text-lg font-semibold">
                        {fmtCurrency(maxLoanResult.totalInterest)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── CTA ──
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
                <p className="text-[var(--text-muted)] text-xs font-body mt-4">
                  Ready to make it official? Apply on our Financing page — fast approvals, all credit profiles welcome.
                </p>
              </motion.div>
              */}
            </motion.div>
          </div>
        </div>

        <div className="relative z-20">
          <Footer />
        </div>
      </div>
    </>
  );
}
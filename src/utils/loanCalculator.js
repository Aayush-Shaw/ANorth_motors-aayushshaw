/**
 * Calculates the total amount to be financed after applying trade-in credit,
 * existing loan balance, down payment, and applicable tax.
 *
 * Tax is applied to (price − tradeInValue), per CRA rules — GST is charged
 * on the net amount after trade-in, not on the full purchase price.
 * Default taxRate is 5 % (Alberta GST; Alberta has no PST).
 *
 * @param {Object}  opts
 * @param {number}  opts.price              - Vehicle purchase price
 * @param {number}  [opts.tradeInValue=0]   - Value of the trade-in vehicle
 * @param {number}  [opts.existingLoanBalance=0] - Outstanding balance on the trade-in's loan
 * @param {number}  [opts.downPayment=0]    - Cash down payment
 * @param {number}  [opts.taxRate=5]        - Tax rate as a percentage (e.g. 5 for 5 %)
 * @returns {number} The financed amount (floored at 0)
 */
export function calculateAmountFinanced({
  price,
  tradeInValue = 0,
  existingLoanBalance = 0,
  downPayment = 0,
  taxRate = 5,
}) {
  const taxableAmount = Math.max(0, price - tradeInValue);
  const tax = taxableAmount * (taxRate / 100);
  const amountFinanced =
    price - tradeInValue + existingLoanBalance - downPayment + tax;
  return Math.max(0, amountFinanced);
}

/**
 * Computes a single periodic payment using the standard amortization formula.
 *
 *   periodRate   = (annualRatePercent / 100) / periodsPerYear
 *   numPayments  = (termMonths / 12) * periodsPerYear
 *   payment      = P × r × (1+r)^n  /  ((1+r)^n − 1)
 *
 * Returns 0 when principal or numPayments is ≤ 0.
 * Returns principal / numPayments when the interest rate is 0 (avoids ÷0).
 *
 * @param {number} principal         - Loan principal (amount financed)
 * @param {number} annualRatePercent - Annual interest rate as a percentage (e.g. 2.99)
 * @param {number} periodsPerYear    - Number of payment periods per year (12, 26, or 52)
 * @param {number} termMonths        - Total loan term in months
 * @returns {number} The periodic payment amount
 */
export function calculatePayment(
  principal,
  annualRatePercent,
  periodsPerYear,
  termMonths,
) {
  if (principal <= 0) return 0;

  const numPayments = (termMonths / 12) * periodsPerYear;
  if (numPayments <= 0) return 0;

  const periodRate = annualRatePercent / 100 / periodsPerYear;
  if (periodRate === 0) return principal / numPayments;

  const compounded = Math.pow(1 + periodRate, numPayments);
  return (principal * periodRate * compounded) / (compounded - 1);
}

/**
 * Builds a table of payment options across three standard frequencies:
 * Monthly (12/yr), Bi-weekly (26/yr), and Weekly (52/yr).
 *
 * Each entry includes the per-period payment amount and the total interest
 * paid over the life of the loan.
 *
 * @param {number} principal         - Loan principal (amount financed)
 * @param {number} annualRatePercent - Annual interest rate as a percentage
 * @param {number} termMonths        - Total loan term in months
 * @returns {{ key: string, label: string, payment: number, totalInterest: number }[]}
 */
export function buildPaymentFrequencyTable(
  principal,
  annualRatePercent,
  termMonths,
) {
  const frequencies = [
    { key: "monthly", label: "Monthly", periodsPerYear: 12 },
    { key: "biweekly", label: "Bi-weekly", periodsPerYear: 26 },
    { key: "weekly", label: "Weekly", periodsPerYear: 52 },
  ];

  return frequencies.map(({ key, label, periodsPerYear }) => {
    const payment = calculatePayment(
      principal,
      annualRatePercent,
      periodsPerYear,
      termMonths,
    );
    const numPayments = (termMonths / 12) * periodsPerYear;
    const totalInterest = Math.max(0, payment * numPayments - principal);

    return { key, label, payment, totalInterest };
  });
}

/**
 * Inverse of calculateAmountFinanced + calculatePayment: given a desired
 * monthly payment, solves for the maximum principal that payment can support,
 * then reverses trade-in / down payment / existing loan / tax to find the
 * maximum vehicle price the buyer can afford.
 *
 * @param {Object} opts
 * @param {number} opts.targetPayment        - Desired monthly payment
 * @param {number} [opts.tradeInValue=0]
 * @param {number} [opts.existingLoanBalance=0]
 * @param {number} [opts.downPayment=0]
 * @param {number} [opts.taxRate=5]
 * @param {number} opts.interestRate         - Annual interest rate as a percentage
 * @param {number} opts.termMonths           - Total loan term in months
 * @returns {{ maxFinanced: number, targetPrice: number, totalInterest: number }}
 */
export function calculateMaxLoan({
  targetPayment,
  tradeInValue = 0,
  existingLoanBalance = 0,
  downPayment = 0,
  taxRate = 5,
  interestRate,
  termMonths,
}) {
  const numPayments = termMonths; // monthly basis, 12/yr
  const periodRate = interestRate / 100 / 12;

  let maxFinanced;
  if (periodRate === 0) {
    maxFinanced = targetPayment * numPayments;
  } else {
    const compounded = Math.pow(1 + periodRate, numPayments);
    maxFinanced =
      (targetPayment * (compounded - 1)) / (periodRate * compounded);
  }

  const totalInterest = Math.max(0, targetPayment * numPayments - maxFinanced);

  // Reverse the tax step:
  // maxFinanced = (price - tradeInValue) * (1 + taxRate/100) + existingLoanBalance - downPayment
  const netOfTax =
    (maxFinanced - existingLoanBalance + downPayment) / (1 + taxRate / 100);
  const targetPrice = Math.max(0, netOfTax + tradeInValue);

  return {
    maxFinanced: Math.max(0, maxFinanced),
    targetPrice,
    totalInterest,
  };
}

/**
 * Shared real-time validation used by both calculator modes.
 * Returns null when valid, or a user-facing error string when invalid.
 *
 * @param {'price'|'payment'} mode
 * @param {Object} inputs - Full inputs state from the calculator
 * @returns {string|null}
 */
export function validateLoanInputs(mode, inputs) {
  const MIN_FINANCED = 5000; // adjust to your client's actual minimum loan amount

  if (!inputs.interestRate || inputs.interestRate <= 0) {
    return "Please enter an interest rate greater than 0%.";
  }
  if (!inputs.termMonths || inputs.termMonths <= 0) {
    return "Please select a loan term greater than 0 months.";
  }

  if (mode === "price") {
    const financed = calculateAmountFinanced(inputs);
    if (financed <= 0) {
      return "Your trade-in and down payment exceed the vehicle price. We can't calculate a payment based on the numbers provided.";
    }
    if (financed < MIN_FINANCED) {
      return `The amount to be financed is below our minimum loan amount of $${MIN_FINANCED.toLocaleString()}.`;
    }
  }

  if (mode === "payment") {
    if (!inputs.targetPayment || inputs.targetPayment <= 0) {
      return "Please enter a target payment greater than $0.";
    }
    const { maxFinanced, targetPrice } = calculateMaxLoan(inputs);
    if (maxFinanced <= 0 || targetPrice <= 0) {
      return "We can't calculate your maximum loan amount based on the numbers provided. Please try again.";
    }
    if (maxFinanced < MIN_FINANCED) {
      return `This payment amount finances less than our minimum loan amount of $${MIN_FINANCED.toLocaleString()}.`;
    }
  }

  return null;
}

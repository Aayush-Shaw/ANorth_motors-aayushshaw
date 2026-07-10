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

  const periodRate = (annualRatePercent / 100) / periodsPerYear;
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
    { key: 'monthly', label: 'Monthly', periodsPerYear: 12 },
    { key: 'biweekly', label: 'Bi-weekly', periodsPerYear: 26 },
    { key: 'weekly', label: 'Weekly', periodsPerYear: 52 },
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

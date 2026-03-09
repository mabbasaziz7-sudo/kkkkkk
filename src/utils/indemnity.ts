export type IndemnityResult = {
  firstFiveAmount: number;
  remainderYearsAmount: number;
  remainderMonthsAmount: number;
  remainderDaysAmount: number;
  rawTotal: number;
  finalTotal: number;
  isCapped: boolean;
  capAmount: number;
};

export const calculateIndemnity = (
  salary: number,
  years: number,
  months: number,
  days: number
): IndemnityResult => {
  // Constants based on Kuwaiti Labor Law / Civil Service
  // First 5 years: 15 days pay per year. Divisor is 26 working days.
  const FIRST_FIVE_DAYS_PER_YEAR = 15;
  const WORKING_DAYS_DIVISOR = 26;
  
  // Remaining years: 1 month pay per year (Full salary).
  // Fractions of remaining years are calculated pro-rata.
  
  // Max cap: 18 months salary.
  const MAX_MONTHS_CAP = 18;

  let firstFiveAmount = 0;
  let remainderYearsAmount = 0;
  let remainderMonthsAmount = 0;
  let remainderDaysAmount = 0;

  // 1. Calculate First 5 Years
  // If service is less than 5 years, the entire duration is at the 15-day rate?
  // Usually yes.
  
  const effectiveFirstFiveYears = Math.min(years, 5);
  // Calculation: (Salary / 26) * 15 * Years
  firstFiveAmount = (salary / WORKING_DAYS_DIVISOR) * FIRST_FIVE_DAYS_PER_YEAR * effectiveFirstFiveYears;

  // If total years < 5, we might also need to account for months/days at the 15-day rate.
  // The image example has > 5 years, so the months/days were part of the "remainder".
  // Standard practice:
  // If < 5 years: All time (years, months, days) is at 15-day rate.
  // If > 5 years: First 5 years at 15-day rate, Rest (Years-5, Months, Days) at Full Salary rate.
  
  // Let's implement this logic.
  
  if (years < 5) {
    // Everything is at 15-day rate
    // Years already done.
    
    // Months: (Salary / 26) * (15/12) * Months ? 
    // Or (Salary / 26) * 15 * (Months / 12)? Yes.
    const monthRate = (salary / WORKING_DAYS_DIVISOR) * FIRST_FIVE_DAYS_PER_YEAR / 12;
    remainderMonthsAmount = monthRate * months;

    // Days: (Salary / 26) * 15 * (Days / 365)?
    // Or just (Salary / 26) * (15 / 365) * Days?
    const dayRate = (salary / WORKING_DAYS_DIVISOR) * FIRST_FIVE_DAYS_PER_YEAR / 365;
    remainderDaysAmount = dayRate * days;
    
    // In this case, "remainderYearsAmount" is 0 because we used effectiveFirstFiveYears for all years.
    // But wait, if years < 5, "remainder" usually refers to the part after 5 years.
    // So let's just add months/days to "firstFiveAmount" conceptually, 
    // OR we can split the output.
    // To match the image structure, if < 5 years, we might just put everything in "First 5 years" bucket?
    // But the image breaks it down by Years/Months/Days for the "Second/Third/Fourth" parts.
    
    // I will put them in the respective fields but note the rate used.
    // Actually, for < 5 years, usually people just see "Total".
    // I'll stick to the buckets.
    
  } else {
    // Years >= 5.
    // firstFiveAmount is already calculated for exactly 5 years.
    
    // Remaining Years
    const remainingYears = years - 5;
    remainderYearsAmount = salary * remainingYears; // Full salary per year.

    // Remaining Months
    // Calculated on Full Salary (since we are past 5 years)
    // Formula: Salary * Months / 12
    remainderMonthsAmount = (salary * months) / 12;

    // Remaining Days
    // Calculated on Full Salary
    // Formula: Salary * Days / 365
    remainderDaysAmount = (salary * days) / 365;
  }

  const rawTotal = firstFiveAmount + remainderYearsAmount + remainderMonthsAmount + remainderDaysAmount;
  
  const capAmount = salary * MAX_MONTHS_CAP;
  const isCapped = rawTotal > capAmount;
  const finalTotal = isCapped ? capAmount : rawTotal;

  return {
    firstFiveAmount,
    remainderYearsAmount,
    remainderMonthsAmount,
    remainderDaysAmount,
    rawTotal,
    finalTotal,
    isCapped,
    capAmount
  };
};

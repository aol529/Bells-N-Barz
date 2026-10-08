// Tape-measure body composition formulas, shared by Me > Weight > Body
// Composition (bmi.js) and Coach Dashboard > Client Progress
// (booking-coach.js) so both always show the same numbers.
// All lengths in cm, weight in kg, sex 'male' | 'female'.
(function(){
  // Waist-to-height ratio
  function whtr(heightCm, waistCm){ return waistCm / heightCm; }
  function whtrCategory(r){
    if (r < 0.4) return {label:'Low', cls:''};
    if (r < 0.5) return {label:'Healthy', cls:'cat-normal'};
    if (r < 0.6) return {label:'Increased risk', cls:'cat-over'};
    return {label:'High risk', cls:'cat-obese'};
  }

  // Relative Fat Mass: any units, as long as height and waist match
  function rfm(sex, heightCm, waistCm){
    return (sex === 'female' ? 76 : 64) - 20 * (heightCm / waistCm);
  }

  // U.S. Navy formula, in inches. null when a measurement is missing or
  // they can't work (log of a number <= 0).
  function navy(sex, heightCm, waistCm, neckCm, hipCm){
    if (!neckCm) return null;
    const h = heightCm / 2.54, w = waistCm / 2.54, n = neckCm / 2.54;
    if (sex === 'female'){
      if (!hipCm) return null;
      const span = w + hipCm / 2.54 - n;
      return span > 0 ? 163.205 * Math.log10(span) - 97.684 * Math.log10(h) - 78.387 : null;
    }
    return w - n > 0 ? 86.010 * Math.log10(w - n) - 70.041 * Math.log10(h) + 36.76 : null;
  }

  // Best available body fat %: Navy (uses more measurements), else RFM.
  // m: { sex, waistCm, neckCm, hipCm }
  function estimate(m, heightCm){
    const navyPct = navy(m.sex, heightCm, m.waistCm, m.neckCm, m.hipCm);
    return navyPct !== null
      ? { pct: navyPct, method: 'Navy' }
      : { pct: rfm(m.sex, heightCm, m.waistCm), method: 'RFM' };
  }

  // Fat-Free Mass Index: lean mass ÷ height²
  function ffmi(weightKg, heightCm, bodyFatPct){
    const m = heightCm / 100;
    return weightKg * (1 - bodyFatPct / 100) / (m * m);
  }

  // A Body Shape Index = waist / (BMI^(2/3) × height^(1/2)), metres and kg
  function absi(weightKg, heightCm, waistCm){
    const m = heightCm / 100;
    const bmi = weightKg / (m * m);
    return (waistCm / 100) / (Math.pow(bmi, 2/3) * Math.sqrt(m));
  }

  window.BNB_BODYFAT = { whtr, whtrCategory, rfm, navy, estimate, ffmi, absi };
})();

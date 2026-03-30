// Appendix-4: binary items explicitly marked Yes(3)/No(0)
const MIASM_BINARY_ITEMS = new Set([32, 33, 34, 36, 45, 49]);

// Appendix-4: star-based miasm classification
const PSORIC_SET = new Set([1,2,3,4,5,6,7,8,9,28,29,41,43,45,46,53,55,58,62,65,66,70]);
const SYPHILITIC_SET = new Set([10,11,12,13,14,15,31,32,33,34,36,37,38,49,54,56,59,61,69,71]);
const SYCOTIC_SET = new Set([17,18,19,20,21,22,23,24,25,26,27,42,44,47,48,50,51,52,57,60,63,64,67,68,72]);

export const miasm_questions = [
  "Anxious","Restless","Fearful","Easily gets angry from trifles","Quick, active",
  "Aggravation from mental excitement","Nervous","Dislike for bathing","Weeping disposition","Idiotic",
  "Suicidal tendency / thoughts","Keeping troubles to themselves","Impulsive","Obstinate","Fixed ideas",
  "Cruel","Cunning","Secretive","Suspicious","Selfish","Jealous","Mischievous","Cross","Rage",
  "Workaholics","Greedy","Avaricious","Easily fatigued mentally and physically","Hypersensitive mentally and physically",
  "Hair lustreless, breaks easily","Premature greying of hair","Depressed nasal root","High-arched palate",
  "Excessive salivation","Halitosis","Tongue large, flabby, imprinted","Crack on tongue",
  "Teeth irregular in shape and / or irregular alignment","Aversion to meat","Desire for cold food and drink",
  "Desire for hot food","Desire for both hot and cold food","Desire for sweet","Intolerance of meat",
  "History of suppressed eruptions","Skin dry, rough, unwashed appearance","Warts and warty growth",
  "Hair on unusual body parts","Congenital malformations","Offensive discharge","Thick, greenish-yellow discharge",
  "Fishy or Hering-brine odour","Burning sensation in different body parts","Asymmetrical body parts",
  "Chilly patient","Hot patient","Affected by both chill and heat","Aggravation from standing","Aggravation from heat",
  "Aggravation from rest","Aggravation at night","Aggravation in the morning","Aggravation from damp weather",
  "Aggravation from natural discharge","Amelioration from natural discharge",
  "Amelioration from reappearance of suppressed skin eruption","Amelioration from abnormal discharge",
  "Amelioration from continued motion","Amelioration from haemorrhage","Amelioration by rest",
  "Amelioration from breaking out of an ulcer","Amelioration from cold"
];

export const susc_questions = [
  "Intelligence","Age (years)","Frequency of consuming allopathic medicines",
  "Frequency of consuming homeopathy and/or other AYUSH medicines",
  "Tendency to catch ailments, reaction to environmental changes","Familial predisposition to diseases",
  "Pathological state of present suffering","Substance abuse and/or dependence","Emotional state",
  "Degree of similarity obtained with the indicated homoeopathic medicine","Nature of symptoms","Mode of onset",
  "Duration of suffering","Perceived stress (PSS-14)","Organs involved","Occupation","History of similar sufferings",
  "Nature or gravity of disease","Body mass index","Reduced muscle mass (ASMI)",
  "Involuntary weight loss (%)","Reduced food intake"
];

function safeInt(x) {
  if (x == null) return 0;
  const s = String(x).trim();
  if (s === '') return 0;
  const n = parseInt(parseFloat(s));
  return isNaN(n) ? 0 : n;
}

function scoreMiasmValue(raw, isBinary) {
  if (raw == null) return 0;
  const v = String(raw).trim().toLowerCase();
  if (v === '') return 0;
  if (isBinary) {
    return ['yes','y','true','1','3'].includes(v) ? 3 : 0;
  }
  if (['strong','s'].includes(v)) return 3;
  if (['moderate','mod','m'].includes(v)) return 2;
  if (['mild','mi'].includes(v)) return 1;
  if (['absent','a','no','n'].includes(v)) return 0;
  const n = safeInt(v);
  return [0,1,2,3].includes(n) ? n : 0;
}

export function calcMiasmTotals(miasmJson) {
  let ps = 0, sy = 0, sc = 0;
  for (let i = 1; i <= 72; i++) {
    const raw = miasmJson?.[`miasm_${i}`];
    const score = scoreMiasmValue(raw, MIASM_BINARY_ITEMS.has(i));
    if (PSORIC_SET.has(i)) ps += score;
    else if (SYPHILITIC_SET.has(i)) sy += score;
    else if (SYCOTIC_SET.has(i)) sc += score;
  }
  return { psoric: ps, syphilitic: sy, sycotic: sc };
}

export function calcSusceptibilityTotal(suscJson) {
  let total = 0;
  for (let i = 1; i <= susc_questions.length; i++) {
    total += safeInt(suscJson?.[`susc_${i}`]);
  }
  return total;
}

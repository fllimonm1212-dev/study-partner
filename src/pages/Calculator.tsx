import { useState, useEffect } from 'react';
import { 
  Calculator as CalcIcon, 
  BookOpen, 
  Search, 
  Copy, 
  Check, 
  RotateCcw, 
  History, 
  Atom, 
  Sigma, 
  Scale, 
  Binary, 
  Variable, 
  Sliders, 
  Sparkles, 
  ChevronRight, 
  FlaskConical, 
  Zap, 
  HelpCircle, 
  ArrowRight,
  Maximize2,
  RefreshCw,
  Calculator
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { cn } from '../components/Sidebar';

// Types
interface ConstantItem {
  id: string;
  name: string;
  nameBn: string;
  symbol: string;
  value: number;
  valueFormatted: string;
  unit: string;
  category: 'Physics' | 'Chemistry' | 'Math';
  level: 'SSC' | 'HSC' | 'Both';
  description: string;
}

interface FormulaItem {
  id: string;
  title: string;
  titleBn: string;
  category: 'Physics' | 'Chemistry' | 'Math';
  level: 'SSC' | 'HSC' | 'Both';
  subCategory: string;
  formula: string;
  explanation: string;
  variables: { symbol: string; name: string; unit: string }[];
}

// Extensive Scientific Constants Dataset
const SCIENTIFIC_CONSTANTS: ConstantItem[] = [
  // Physics
  {
    id: 'c',
    name: 'Speed of Light in Vacuum',
    nameBn: 'শূন্যস্থানে আলোর বেগ',
    symbol: 'c',
    value: 299792458,
    valueFormatted: '2.9979 × 10⁸',
    unit: 'm/s',
    category: 'Physics',
    level: 'Both',
    description: 'Fundamental constant defining the upper speed limit of matter and energy.'
  },
  {
    id: 'g',
    name: 'Acceleration due to Gravity',
    nameBn: 'অভিকর্ষজ ত্বরণ',
    symbol: 'g',
    value: 9.80665,
    valueFormatted: '9.80665 (or 9.8)',
    unit: 'm/s²',
    category: 'Physics',
    level: 'Both',
    description: 'Standard gravitational acceleration at Earth\'s surface.'
  },
  {
    id: 'G',
    name: 'Gravitational Constant',
    nameBn: 'মহাকর্ষীয় ধ্রুবক',
    symbol: 'G',
    value: 6.67430e-11,
    valueFormatted: '6.6743 × 10⁻¹¹',
    unit: 'N·m²/kg²',
    category: 'Physics',
    level: 'Both',
    description: 'Newtonian gravitational constant for mass attraction.'
  },
  {
    id: 'h',
    name: 'Planck Constant',
    nameBn: 'প্লাঙ্কের ধ্রুবক',
    symbol: 'h',
    value: 6.62607015e-34,
    valueFormatted: '6.626 × 10⁻³⁴',
    unit: 'J·s',
    category: 'Physics',
    level: 'HSC',
    description: 'Quantum constant relating photon energy to frequency.'
  },
  {
    id: 'e_charge',
    name: 'Elementary Charge',
    nameBn: 'মৌলিক চার্জ',
    symbol: 'e',
    value: 1.602176634e-19,
    valueFormatted: '1.602 × 10⁻¹⁹',
    unit: 'C',
    category: 'Physics',
    level: 'Both',
    description: 'Magnitude of charge carried by a single proton or electron.'
  },
  {
    id: 'me',
    name: 'Electron Mass',
    nameBn: 'ইলেকট্রনের ভর',
    symbol: 'mₑ',
    value: 9.1093837e-31,
    valueFormatted: '9.11 × 10⁻³¹',
    unit: 'kg',
    category: 'Physics',
    level: 'HSC',
    description: 'Rest mass of an electron.'
  },
  {
    id: 'mp',
    name: 'Proton Mass',
    nameBn: 'প্রোটনের ভর',
    symbol: 'mₚ',
    value: 1.6726219e-27,
    valueFormatted: '1.673 × 10⁻²⁷',
    unit: 'kg',
    category: 'Physics',
    level: 'HSC',
    description: 'Rest mass of a proton.'
  },
  {
    id: 'eps0',
    name: 'Permittivity of Free Space (ε₀)',
    nameBn: 'ভেদ্যতা (ε₀)',
    symbol: 'ε₀',
    value: 8.8541878e-12,
    valueFormatted: '8.854 × 10⁻¹²',
    unit: 'F/m or C²/N·m²',
    category: 'Physics',
    level: 'HSC',
    description: 'Dielectric permittivity of vacuum in electrostatics.'
  },
  {
    id: 'ke',
    name: 'Coulomb Constant (k_e)',
    nameBn: 'কুলম্বের ধ্রুবক',
    symbol: 'kₑ',
    value: 8.98755179e9,
    valueFormatted: '9.0 × 10⁹',
    unit: 'N·m²/C²',
    category: 'Physics',
    level: 'Both',
    description: 'Proportionality factor in Coulomb\'s electrostatic force law.'
  },

  // Chemistry
  {
    id: 'NA',
    name: 'Avogadro Constant',
    nameBn: 'অ্যাভোগাড্রো সংখ্যা',
    symbol: 'N_A',
    value: 6.02214076e23,
    valueFormatted: '6.022 × 10²³',
    unit: 'mol⁻¹',
    category: 'Chemistry',
    level: 'Both',
    description: 'Number of constituent particles in 1 mole of substance.'
  },
  {
    id: 'R',
    name: 'Molar Gas Constant',
    nameBn: 'মোলার গ্যস ধ্রুবক',
    symbol: 'R',
    value: 8.3144626,
    valueFormatted: '8.314 (SI) / 0.0821 (L·atm)',
    unit: 'J/(mol·K)',
    category: 'Chemistry',
    level: 'Both',
    description: 'Universal gas constant in ideal gas law.'
  },
  {
    id: 'kB',
    name: 'Boltzmann Constant',
    nameBn: 'বোল্টজম্যান ধ্রুবক',
    symbol: 'k_B',
    value: 1.380649e-23,
    valueFormatted: '1.38 × 10⁻²³',
    unit: 'J/K',
    category: 'Chemistry',
    level: 'HSC',
    description: 'Gas constant per individual molecule.'
  },
  {
    id: 'F',
    name: 'Faraday Constant',
    nameBn: 'ফ্যারাডের ধ্রুবক',
    symbol: 'F',
    value: 96485.33,
    valueFormatted: '96500',
    unit: 'C/mol',
    category: 'Chemistry',
    level: 'HSC',
    description: 'Total electric charge per mole of electrons.'
  },
  {
    id: 'atm',
    name: 'Standard Atmospheric Pressure',
    nameBn: 'প্রমাণ বায়ুমণ্ডলীয় চাপ',
    symbol: '1 atm',
    value: 101325,
    valueFormatted: '101325 (or 1.013 × 10⁵)',
    unit: 'Pa / N/m²',
    category: 'Chemistry',
    level: 'Both',
    description: 'Standard atmospheric pressure at sea level (760 mmHg).'
  },

  // Math
  {
    id: 'pi',
    name: 'Archimedes Constant (π)',
    nameBn: 'পাই (π)',
    symbol: 'π',
    value: Math.PI,
    valueFormatted: '3.14159265359',
    unit: 'ratio',
    category: 'Math',
    level: 'Both',
    description: 'Ratio of circle circumference to diameter.'
  },
  {
    id: 'e_math',
    name: 'Euler\'s Constant (e)',
    nameBn: 'অয়লারের সংখ্যা (e)',
    symbol: 'e',
    value: Math.E,
    valueFormatted: '2.71828182846',
    unit: 'ratio',
    category: 'Math',
    level: 'Both',
    description: 'Base of natural logarithms.'
  },
  {
    id: 'phi',
    name: 'Golden Ratio (φ)',
    nameBn: 'গোল্ডেন রেশিও (φ)',
    symbol: 'φ',
    value: 1.61803398875,
    valueFormatted: '1.61803398',
    unit: 'ratio',
    category: 'Math',
    level: 'HSC',
    description: 'Unique algebraic constant in geometry and art.'
  }
];

// Comprehensive SSC & HSC Formulas Dataset
const FORMULAS_LIBRARY: FormulaItem[] = [
  // Physics - SSC
  {
    id: 'ssc_p1',
    title: 'Newton\'s Second Law',
    titleBn: 'নিউটন বলবিদ্যা (দ্বিতীয় সূত্র)',
    category: 'Physics',
    level: 'SSC',
    subCategory: 'Motion & Force',
    formula: 'F = m · a',
    explanation: 'Applied force is directly proportional to the rate of change of momentum.',
    variables: [
      { symbol: 'F', name: 'Force (বল)', unit: 'N' },
      { symbol: 'm', name: 'Mass (ভর)', unit: 'kg' },
      { symbol: 'a', name: 'Acceleration (ত্বরণ)', unit: 'm/s²' }
    ]
  },
  {
    id: 'ssc_p2',
    title: 'Kinematics Motion Equation',
    titleBn: 'গতির সমীকরণ (v = u + at)',
    category: 'Physics',
    level: 'SSC',
    subCategory: 'Motion',
    formula: 'v = u + a · t',
    explanation: 'Final velocity under uniform linear acceleration.',
    variables: [
      { symbol: 'v', name: 'Final Velocity (শেষ বেগ)', unit: 'm/s' },
      { symbol: 'u', name: 'Initial Velocity (আদি বেগ)', unit: 'm/s' },
      { symbol: 'a', name: 'Acceleration (ত্বরণ)', unit: 'm/s²' },
      { symbol: 't', name: 'Time (সময়)', unit: 's' }
    ]
  },
  {
    id: 'ssc_p3',
    title: 'Kinematics Distance Equation',
    titleBn: 'গতির দূরত্ব সমীকরণ (s = ut + ½at²)',
    category: 'Physics',
    level: 'SSC',
    subCategory: 'Motion',
    formula: 's = u · t + ½ · a · t²',
    explanation: 'Total distance traversed under uniform acceleration.',
    variables: [
      { symbol: 's', name: 'Distance (দূরত্ব)', unit: 'm' },
      { symbol: 'u', name: 'Initial Velocity (আদি বেগ)', unit: 'm/s' },
      { symbol: 'a', name: 'Acceleration (ত্বরণ)', unit: 'm/s²' },
      { symbol: 't', name: 'Time (সময়)', unit: 's' }
    ]
  },
  {
    id: 'ssc_p4',
    title: 'Work, Power & Energy',
    titleBn: 'কাজ ও ক্ষমতা (W = F · s)',
    category: 'Physics',
    level: 'SSC',
    subCategory: 'Work & Power',
    formula: 'W = F · s · cos(θ)',
    explanation: 'Work done equals force multiplied by displacement in the direction of force.',
    variables: [
      { symbol: 'W', name: 'Work (কাজ)', unit: 'J' },
      { symbol: 'F', name: 'Force (বল)', unit: 'N' },
      { symbol: 's', name: 'Displacement (সরন)', unit: 'm' },
      { symbol: 'θ', name: 'Angle (কোণ)', unit: 'deg' }
    ]
  },
  {
    id: 'ssc_p5',
    title: 'Ohm\'s Law',
    titleBn: 'ওহমের সূত্র (V = I · R)',
    category: 'Physics',
    level: 'SSC',
    subCategory: 'Current Electricity',
    formula: 'V = I · R',
    explanation: 'Current flowing through a metallic conductor is directly proportional to voltage.',
    variables: [
      { symbol: 'V', name: 'Voltage (বিভবের মান)', unit: 'V' },
      { symbol: 'I', name: 'Current (বিদ্যুৎ প্রবাহ)', unit: 'A' },
      { symbol: 'R', name: 'Resistance (রোধ)', unit: 'Ω' }
    ]
  },

  // Physics - HSC
  {
    id: 'hsc_p1',
    title: 'Coulomb\'s Law in Electrostatics',
    titleBn: 'কুলম্বের সূত্র (স্থির তড়িৎ)',
    category: 'Physics',
    level: 'HSC',
    subCategory: 'Electrostatics',
    formula: 'F = kₑ · (|q₁ · q₂| / r²)',
    explanation: 'Electrostatic force between two point charges in vacuum.',
    variables: [
      { symbol: 'F', name: 'Electrostatic Force (বল)', unit: 'N' },
      { symbol: 'q₁', name: 'Charge 1 (চার্জ ১)', unit: 'C' },
      { symbol: 'q₂', name: 'Charge 2 (চার্জ ২)', unit: 'C' },
      { symbol: 'r', name: 'Distance (দূরত্ব)', unit: 'm' }
    ]
  },
  {
    id: 'hsc_p2',
    title: 'Einstein Mass-Energy Equivalence',
    titleBn: 'ভর-শক্তি সমীকরণ (E = mc²)',
    category: 'Physics',
    level: 'HSC',
    subCategory: 'Modern Physics',
    formula: 'E = m · c²',
    explanation: 'Relativity principle connecting mass defect and total energy.',
    variables: [
      { symbol: 'E', name: 'Energy (শক্তি)', unit: 'J' },
      { symbol: 'm', name: 'Mass Defect (ভর ক্ষতি)', unit: 'kg' },
      { symbol: 'c', name: 'Speed of Light (আলোর বেগ)', unit: 'm/s' }
    ]
  },
  {
    id: 'hsc_p3',
    title: 'de Broglie Wavelength',
    titleBn: 'দ্য ব্রগলি তরঙ্গদৈর্ঘ্য (λ = h / p)',
    category: 'Physics',
    level: 'HSC',
    subCategory: 'Modern Physics',
    formula: 'λ = h / (m · v)',
    explanation: 'Wave-particle duality of moving matter particles.',
    variables: [
      { symbol: 'λ', name: 'Wavelength (তরঙ্গদৈর্ঘ্য)', unit: 'm' },
      { symbol: 'h', name: 'Planck Constant', unit: 'J·s' },
      { symbol: 'm', name: 'Mass (ভর)', unit: 'kg' },
      { symbol: 'v', name: 'Velocity (বেগ)', unit: 'm/s' }
    ]
  },
  {
    id: 'hsc_p4',
    title: 'Vector Dot Product',
    titleBn: 'ভেক্টরের ডট গুণন (A · B)',
    category: 'Physics',
    level: 'HSC',
    subCategory: 'Vectors',
    formula: 'A · B = |A| · |B| · cos(θ)',
    explanation: 'Scalar product of two vector quantities.',
    variables: [
      { symbol: 'A·B', name: 'Dot Product', unit: 'scalar' },
      { symbol: '|A|', name: 'Magnitude A', unit: 'units' },
      { symbol: '|B|', name: 'Magnitude B', unit: 'units' },
      { symbol: 'θ', name: 'Angle between vectors', unit: 'deg' }
    ]
  },

  // Chemistry - SSC & HSC
  {
    id: 'ssc_c1',
    title: 'Ideal Gas Law',
    titleBn: 'আদর্শ গ্যাস সমীকরণ (PV = nRT)',
    category: 'Chemistry',
    level: 'Both',
    subCategory: 'Gaseous State',
    formula: 'P · V = n · R · T',
    explanation: 'State equation for an ideal gas sample.',
    variables: [
      { symbol: 'P', name: 'Pressure (চাপ)', unit: 'atm / Pa' },
      { symbol: 'V', name: 'Volume (আয়তন)', unit: 'L / m³' },
      { symbol: 'n', name: 'Moles (মোল সংখ্যা)', unit: 'mol' },
      { symbol: 'R', name: 'Gas Constant', unit: 'J/(mol·K)' },
      { symbol: 'T', name: 'Temperature (তাপমাত্রা)', unit: 'K' }
    ]
  },
  {
    id: 'hsc_c2',
    title: 'pH & pOH Formula',
    titleBn: 'pH গণনা (অম্ল ও ক্ষার)',
    category: 'Chemistry',
    level: 'Both',
    subCategory: 'Acids & Bases',
    formula: 'pH = -log₁₀[H⁺]',
    explanation: 'Logarithmic scale measuring hydrogen ion activity.',
    variables: [
      { symbol: 'pH', name: 'pH Value', unit: 'scale 0-14' },
      { symbol: '[H⁺]', name: 'H⁺ Concentration', unit: 'mol/L' }
    ]
  },
  {
    id: 'hsc_c3',
    title: 'Boyle\'s Law',
    titleBn: 'বয়েলের সূত্র (P₁V₁ = P₂V₂)',
    category: 'Chemistry',
    level: 'SSC',
    subCategory: 'Gas Laws',
    formula: 'P₁ · V₁ = P₂ · V₂',
    explanation: 'Gas pressure is inversely proportional to volume at constant temperature.',
    variables: [
      { symbol: 'P₁', name: 'Initial Pressure', unit: 'atm' },
      { symbol: 'V₁', name: 'Initial Volume', unit: 'L' },
      { symbol: 'P₂', name: 'Final Pressure', unit: 'atm' },
      { symbol: 'V₂', name: 'Final Volume', unit: 'L' }
    ]
  },
  {
    id: 'hsc_c4',
    title: 'Nernst Equation',
    titleBn: 'নার্নস্ট সমীকরণ (তড়িৎ রসায়ন)',
    category: 'Chemistry',
    level: 'HSC',
    subCategory: 'Electrochemistry',
    formula: 'E = E° - (R·T / n·F) · ln(Q)',
    explanation: 'Cell potential calculation under non-standard conditions.',
    variables: [
      { symbol: 'E', name: 'Cell Potential', unit: 'V' },
      { symbol: 'E°', name: 'Standard Cell Potential', unit: 'V' },
      { symbol: 'n', name: 'Electrons transferred', unit: 'moles' },
      { symbol: 'Q', name: 'Reaction Quotient', unit: 'unitless' }
    ]
  },

  // Higher Math - SSC & HSC
  {
    id: 'ssc_m1',
    title: 'Quadratic Formula',
    titleBn: 'দ্বিঘাত সমীকরণের মূল (ax² + bx + c = 0)',
    category: 'Math',
    level: 'Both',
    subCategory: 'Algebra',
    formula: 'x = (-b ± √(b² - 4ac)) / (2a)',
    explanation: 'Universal solution for roots of second-degree polynomial.',
    variables: [
      { symbol: 'a', name: 'x² Coefficient', unit: 'number' },
      { symbol: 'b', name: 'x Coefficient', unit: 'number' },
      { symbol: 'c', name: 'Constant Term', unit: 'number' }
    ]
  },
  {
    id: 'hsc_m2',
    title: 'Derivative Power Rule',
    titleBn: 'অন্তরীকরণ ক্ষমতা নীতি (d/dx(xⁿ))',
    category: 'Math',
    level: 'HSC',
    subCategory: 'Calculus - Differentiation',
    formula: 'd/dx (xⁿ) = n · xⁿ⁻¹',
    explanation: 'Basic power rule for finding derivative functions.',
    variables: [
      { symbol: 'n', name: 'Exponent Power', unit: 'constant' },
      { symbol: 'x', name: 'Variable', unit: 'real' }
    ]
  },
  {
    id: 'hsc_m3',
    title: 'Integration Power Rule',
    titleBn: 'যৌগীকরণ পাওয়ার রুল (∫ xⁿ dx)',
    category: 'Math',
    level: 'HSC',
    subCategory: 'Calculus - Integration',
    formula: '∫ xⁿ dx = (xⁿ⁺¹ / (n + 1)) + C',
    explanation: 'Indefinite integral power rule (where n ≠ -1).',
    variables: [
      { symbol: 'n', name: 'Power Exponent', unit: 'constant' },
      { symbol: 'C', name: 'Constant of Integration', unit: 'constant' }
    ]
  },
  {
    id: 'hsc_m4',
    title: 'Trigonometric Pythagorean Identity',
    titleBn: 'ত্রিকোণমিতি অভেদ (sin²θ + cos²θ = 1)',
    category: 'Math',
    level: 'Both',
    subCategory: 'Trigonometry',
    formula: 'sin²(θ) + cos²(θ) = 1',
    explanation: 'Fundamental trigonometric pythagorean identity.',
    variables: [
      { symbol: 'θ', name: 'Angle', unit: 'deg / rad' }
    ]
  },
  {
    id: 'hsc_m5',
    title: 'Distance Between Two Coordinates',
    titleBn: 'দুই বিন্দুর দূরত্ব (স্থানাঙ্ক জ্যামিতি)',
    category: 'Math',
    level: 'Both',
    subCategory: 'Coordinate Geometry',
    formula: 'd = √((x₂ - x₁)² + (y₂ - y₁)²)',
    explanation: 'Euclidean distance between points (x₁, y₁) and (x₂, y₂).',
    variables: [
      { symbol: 'x₁, y₁', name: 'Point 1', unit: 'coord' },
      { symbol: 'x₂, y₂', name: 'Point 2', unit: 'coord' }
    ]
  }
];

export default function CalculatorPage() {
  const [activeTab, setActiveTab] = useState<'calculator' | 'solver' | 'converter' | 'library'>('calculator');
  
  // Calculator States
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [memory, setMemory] = useState<number | null>(null);
  const [prevAns, setPrevAns] = useState<number | null>(null);
  const [isRad, setIsRad] = useState(false);
  const [historyList, setHistoryList] = useState<{ expr: string; result: string }[]>([]);

  // Quadratic Solver States
  const [quadA, setQuadA] = useState('1');
  const [quadB, setQuadB] = useState('-5');
  const [quadC, setQuadC] = useState('6');
  const [quadResult, setQuadResult] = useState<{ x1: string; x2: string; disc: number; vertex: string } | null>(null);

  // Linear System Solver (2 variables)
  const [linA1, setLinA1] = useState('2');
  const [linB1, setLinB1] = useState('3');
  const [linC1, setLinC1] = useState('12');
  const [linA2, setLinA2] = useState('1');
  const [linB2, setLinB2] = useState('-1');
  const [linC2, setLinC2] = useState('1');
  const [linResult, setLinResult] = useState<{ x: string; y: string } | null>(null);

  // Converter States
  const [convCategory, setConvCategory] = useState<'Temperature' | 'Length' | 'Mass' | 'Energy' | 'Pressure'>('Temperature');
  const [convVal, setConvVal] = useState('100');
  const [convFrom, setConvFrom] = useState('Celsius');
  const [convTo, setConvTo] = useState('Fahrenheit');
  const [convResult, setConvResult] = useState<string>('');

  // Library States
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Physics' | 'Chemistry' | 'Math'>('All');
  const [selectedLevel, setSelectedLevel] = useState<'All' | 'SSC' | 'HSC'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Formula Solve Modal
  const [activeFormulaModal, setActiveFormulaModal] = useState<FormulaItem | null>(null);
  const [formulaInputs, setFormulaInputs] = useState<Record<string, string>>({});
  const [formulaCalculatedResult, setFormulaCalculatedResult] = useState<string | null>(null);

  // --- Scientific Calculator Logic ---
  const evaluateExpression = (exprToEval: string) => {
    try {
      if (!exprToEval || exprToEval.trim() === '') return;
      
      let cleaned = exprToEval
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, 'Math.PI')
        .replace(/e/g, 'Math.E')
        .replace(/√\(/g, 'Math.sqrt(')
        .replace(/√([0-9.]+)/g, 'Math.sqrt($1)')
        .replace(/\^/g, '**');

      cleaned = cleaned.replace(/(\d+)!/g, (_, n) => {
        let val = parseInt(n, 10);
        if (val < 0) return 'NaN';
        let res = 1;
        for (let i = 2; i <= val; i++) res *= i;
        return res.toString();
      });

      if (!isRad) {
        cleaned = cleaned
          .replace(/sin\(([^)]+)\)/g, (_, arg) => `Math.sin((${arg}) * Math.PI / 180)`)
          .replace(/cos\(([^)]+)\)/g, (_, arg) => `Math.cos((${arg}) * Math.PI / 180)`)
          .replace(/tan\(([^)]+)\)/g, (_, arg) => `Math.tan((${arg}) * Math.PI / 180)`);
      } else {
        cleaned = cleaned
          .replace(/sin\(/g, 'Math.sin(')
          .replace(/cos\(/g, 'Math.cos(')
          .replace(/tan\(/g, 'Math.tan(');
      }

      cleaned = cleaned
        .replace(/log\(/g, 'Math.log10(')
        .replace(/ln\(/g, 'Math.log(')
        .replace(/abs\(/g, 'Math.abs(');

      // eslint-disable-next-line no-eval
      const res = eval(cleaned);

      if (isNaN(res) || !isFinite(res)) {
        setDisplay('Error');
        return;
      }

      const formattedRes = Number.isInteger(res) 
        ? res.toString() 
        : parseFloat(res.toFixed(10)).toString();

      setDisplay(formattedRes);
      setPrevAns(res);
      setHistoryList(prev => [{ expr: exprToEval, result: formattedRes }, ...prev.slice(0, 19)]);
    } catch (err) {
      setDisplay('Error');
    }
  };

  const handleInput = (val: string) => {
    if (display === 'Error') {
      setDisplay(val);
      setExpression(val);
      return;
    }

    if (display === '0' && !['+', '-', '×', '÷', '^', '%'].includes(val)) {
      setDisplay(val);
      setExpression(val);
    } else {
      setDisplay(prev => prev + val);
      setExpression(prev => prev + val);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setExpression('');
  };

  const handleDelete = () => {
    if (display.length <= 1 || display === 'Error') {
      setDisplay('0');
      setExpression('');
    } else {
      setDisplay(prev => prev.slice(0, -1));
      setExpression(prev => prev.slice(0, -1));
    }
  };

  const handleInsertConstant = (val: number, name: string) => {
    const valStr = val.toString();
    if (display === '0' || display === 'Error') {
      setDisplay(valStr);
      setExpression(valStr);
    } else {
      setDisplay(prev => prev + valStr);
      setExpression(prev => prev + valStr);
    }
    setActiveTab('calculator');
    toast.success(`Inserted ${name} into Calculator!`);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // --- Quadratic Equation Solver ---
  const solveQuadratic = () => {
    const a = parseFloat(quadA);
    const b = parseFloat(quadB);
    const c = parseFloat(quadC);

    if (isNaN(a) || isNaN(b) || isNaN(c)) {
      toast.error('Please enter valid numeric values for a, b, and c.');
      return;
    }

    if (a === 0) {
      toast.error('Value "a" cannot be zero in a quadratic equation.');
      return;
    }

    const disc = b * b - 4 * a * c;
    const vertexX = -b / (2 * a);
    const vertexY = a * vertexX * vertexX + b * vertexX + c;

    if (disc > 0) {
      const x1 = (-b + Math.sqrt(disc)) / (2 * a);
      const x2 = (-b - Math.sqrt(disc)) / (2 * a);
      setQuadResult({
        x1: parseFloat(x1.toFixed(6)).toString(),
        x2: parseFloat(x2.toFixed(6)).toString(),
        disc,
        vertex: `(${vertexX.toFixed(2)}, ${vertexY.toFixed(2)})`
      });
    } else if (disc === 0) {
      const x = -b / (2 * a);
      setQuadResult({
        x1: parseFloat(x.toFixed(6)).toString(),
        x2: parseFloat(x.toFixed(6)).toString() + ' (Repeated)',
        disc,
        vertex: `(${vertexX.toFixed(2)}, ${vertexY.toFixed(2)})`
      });
    } else {
      const real = (-b / (2 * a)).toFixed(4);
      const imag = (Math.sqrt(-disc) / (2 * a)).toFixed(4);
      setQuadResult({
        x1: `${real} + ${imag}i`,
        x2: `${real} - ${imag}i`,
        disc,
        vertex: `(${vertexX.toFixed(2)}, ${vertexY.toFixed(2)})`
      });
    }
  };

  // --- System Linear Solver ---
  const solveLinearSystem = () => {
    const a1 = parseFloat(linA1);
    const b1 = parseFloat(linB1);
    const c1 = parseFloat(linC1);
    const a2 = parseFloat(linA2);
    const b2 = parseFloat(linB2);
    const c2 = parseFloat(linC2);

    const det = a1 * b2 - a2 * b1;
    if (det === 0) {
      toast.error('No unique solution (Determinant is 0). Lines are parallel or coincident.');
      return;
    }

    const x = (c1 * b2 - c2 * b1) / det;
    const y = (a1 * c2 - a2 * c1) / det;

    setLinResult({
      x: parseFloat(x.toFixed(6)).toString(),
      y: parseFloat(y.toFixed(6)).toString()
    });
  };

  // --- Converter Logic ---
  useEffect(() => {
    const val = parseFloat(convVal);
    if (isNaN(val)) {
      setConvResult('Invalid input');
      return;
    }

    if (convCategory === 'Temperature') {
      if (convFrom === 'Celsius' && convTo === 'Fahrenheit') setConvResult(((val * 9/5) + 32).toFixed(2) + ' °F');
      else if (convFrom === 'Celsius' && convTo === 'Kelvin') setConvResult((val + 273.15).toFixed(2) + ' K');
      else if (convFrom === 'Fahrenheit' && convTo === 'Celsius') setConvResult(((val - 32) * 5/9).toFixed(2) + ' °C');
      else if (convFrom === 'Fahrenheit' && convTo === 'Kelvin') setConvResult((((val - 32) * 5/9) + 273.15).toFixed(2) + ' K');
      else if (convFrom === 'Kelvin' && convTo === 'Celsius') setConvResult((val - 273.15).toFixed(2) + ' °C');
      else if (convFrom === 'Kelvin' && convTo === 'Fahrenheit') setConvResult((((val - 273.15) * 9/5) + 32).toFixed(2) + ' °F');
      else setConvResult(val + ' ' + convTo);
    } else if (convCategory === 'Length') {
      // Base: meters
      let inMeters = val;
      if (convFrom === 'Kilometer') inMeters = val * 1000;
      if (convFrom === 'Centimeter') inMeters = val / 100;
      if (convFrom === 'Millimeter') inMeters = val / 1000;
      if (convFrom === 'Nanometer') inMeters = val / 1e9;
      if (convFrom === 'Angstrom') inMeters = val / 1e10;

      let res = inMeters;
      if (convTo === 'Kilometer') res = inMeters / 1000;
      if (convTo === 'Centimeter') res = inMeters * 100;
      if (convTo === 'Millimeter') res = inMeters * 1000;
      if (convTo === 'Nanometer') res = inMeters * 1e9;
      if (convTo === 'Angstrom') res = inMeters * 1e10;

      setConvResult(res.toExponential(4) + ' / ' + parseFloat(res.toFixed(6)));
    } else if (convCategory === 'Energy') {
      // Base: Joules
      let inJ = val;
      if (convFrom === 'eV') inJ = val * 1.60218e-19;
      if (convFrom === 'Calorie') inJ = val * 4.184;
      if (convFrom === 'kWh') inJ = val * 3.6e6;

      let res = inJ;
      if (convTo === 'eV') res = inJ / 1.60218e-19;
      if (convTo === 'Calorie') res = inJ / 4.184;
      if (convTo === 'kWh') res = inJ / 3.6e6;

      setConvResult(parseFloat(res.toFixed(6)).toString() + ' ' + convTo);
    } else if (convCategory === 'Pressure') {
      // Base: Pa
      let inPa = val;
      if (convFrom === 'atm') inPa = val * 101325;
      if (convFrom === 'mmHg / Torr') inPa = val * 133.322;
      if (convFrom === 'Bar') inPa = val * 100000;

      let res = inPa;
      if (convTo === 'atm') res = inPa / 101325;
      if (convTo === 'mmHg / Torr') res = inPa / 133.322;
      if (convTo === 'Bar') res = inPa / 100000;

      setConvResult(parseFloat(res.toFixed(6)).toString() + ' ' + convTo);
    } else {
      setConvResult(val.toString());
    }
  }, [convVal, convFrom, convTo, convCategory]);

  // Filtered Library Items
  const filteredConstants = SCIENTIFIC_CONSTANTS.filter(c => {
    const matchesCat = selectedCategory === 'All' || c.category === selectedCategory;
    const matchesLvl = selectedLevel === 'All' || c.level === 'Both' || c.level === selectedLevel;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.nameBn.includes(searchQuery) ||
                          c.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesLvl && matchesSearch;
  });

  const filteredFormulas = FORMULAS_LIBRARY.filter(f => {
    const matchesCat = selectedCategory === 'All' || f.category === selectedCategory;
    const matchesLvl = selectedLevel === 'All' || f.level === 'Both' || f.level === selectedLevel;
    const matchesSearch = f.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          f.titleBn.includes(searchQuery) ||
                          f.formula.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          f.subCategory.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesLvl && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      
      {/* Top Banner & Hub Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <CalcIcon size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                Scientific Calculator & SSC/HSC Suite
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  পদার্থ • রসায়ন • উচ্চতর গণিত
                </span>
              </h1>
            </div>
          </div>
          <p className="text-xs text-slate-400 pl-12">
            Fully interactive scientific calculator, algebraic equation solver, unit converter, and complete SSC/HSC formula library.
          </p>
        </div>

        {/* 4 Main Modes Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('calculator')}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all",
              activeTab === 'calculator'
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            )}
          >
            <CalcIcon size={14} />
            Calculator
          </button>
          <button
            onClick={() => setActiveTab('solver')}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all",
              activeTab === 'solver'
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            )}
          >
            <Sigma size={14} />
            Equation Solver
          </button>
          <button
            onClick={() => setActiveTab('converter')}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all",
              activeTab === 'converter'
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            )}
          >
            <Scale size={14} />
            Unit Converter
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all",
              activeTab === 'library'
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            )}
          >
            <BookOpen size={14} />
            SSC / HSC Formulas
          </button>
        </div>
      </div>

      {/* --- TAB 1: SCIENTIFIC CALCULATOR --- */}
      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Scientific Calculator Body */}
          <div className="lg:col-span-8 glass-panel p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
            
            {/* Display Monitor */}
            <div className="bg-slate-950/90 rounded-xl p-4 border border-slate-800/80 shadow-inner space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsRad(!isRad)}
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors border",
                      isRad ? "bg-purple-500/20 text-purple-400 border-purple-500/40" : "bg-indigo-500/20 text-indigo-400 border-indigo-500/40"
                    )}
                  >
                    {isRad ? 'RAD' : 'DEG'}
                  </button>
                  {memory !== null && (
                    <span className="text-amber-400 text-[10px] font-bold px-1.5 py-0.5 bg-amber-500/10 rounded border border-amber-500/30">
                      M = {memory}
                    </span>
                  )}
                  {prevAns !== null && (
                    <span className="text-emerald-400 text-[10px] font-bold">
                      Ans = {prevAns}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 truncate max-w-[220px] text-right">
                  {expression || 'Ready'}
                </div>
              </div>

              {/* Main Result Display */}
              <div className="text-right text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-wider break-all min-h-[48px] flex items-center justify-end">
                {display}
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                <span className="text-[10px] text-slate-500 font-medium">Casio FX-991EX Style Scientific Engine</span>
                <button
                  onClick={() => handleCopy(display, 'display')}
                  className="p-1 rounded bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1"
                >
                  <Copy size={12} />
                  <span className="text-[10px] font-semibold">Copy Result</span>
                </button>
              </div>
            </div>

            {/* Keypad Grid */}
            <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
              
              {/* Row 1: Memory */}
              <button onClick={() => setMemory(null)} className="btn-calc bg-slate-800/60 hover:bg-slate-700 text-slate-300 text-xs">MC</button>
              <button onClick={() => memory !== null && handleInput(memory.toString())} className="btn-calc bg-slate-800/60 hover:bg-slate-700 text-slate-300 text-xs">MR</button>
              <button onClick={() => setMemory(parseFloat(display) || 0)} className="btn-calc bg-slate-800/60 hover:bg-slate-700 text-slate-300 text-xs">MS</button>
              <button onClick={() => setMemory(prev => (prev || 0) + (parseFloat(display) || 0))} className="btn-calc bg-slate-800/60 hover:bg-slate-700 text-slate-300 text-xs">M+</button>
              <button onClick={() => setIsRad(!isRad)} className="btn-calc bg-indigo-950/60 border border-indigo-800/60 text-indigo-400 text-xs font-bold">
                {isRad ? 'RAD' : 'DEG'}
              </button>

              {/* Row 2: Trig & Logs */}
              <button onClick={() => handleInput('sin(')} className="btn-calc bg-slate-800/40 hover:bg-slate-700 text-indigo-300 text-xs font-semibold">sin</button>
              <button onClick={() => handleInput('cos(')} className="btn-calc bg-slate-800/40 hover:bg-slate-700 text-indigo-300 text-xs font-semibold">cos</button>
              <button onClick={() => handleInput('tan(')} className="btn-calc bg-slate-800/40 hover:bg-slate-700 text-indigo-300 text-xs font-semibold">tan</button>
              <button onClick={() => handleInput('log(')} className="btn-calc bg-slate-800/40 hover:bg-slate-700 text-indigo-300 text-xs font-semibold">log</button>
              <button onClick={() => handleInput('ln(')} className="btn-calc bg-slate-800/40 hover:bg-slate-700 text-indigo-300 text-xs font-semibold">ln</button>

              {/* Row 3: Powers & Roots */}
              <button onClick={() => handleInput('^2')} className="btn-calc bg-slate-800/40 hover:bg-slate-700 text-slate-300 text-xs">x²</button>
              <button onClick={() => handleInput('^3')} className="btn-calc bg-slate-800/40 hover:bg-slate-700 text-slate-300 text-xs">x³</button>
              <button onClick={() => handleInput('^')} className="btn-calc bg-slate-800/40 hover:bg-slate-700 text-slate-300 text-xs">xʸ</button>
              <button onClick={() => handleInput('√(')} className="btn-calc bg-slate-800/40 hover:bg-slate-700 text-slate-300 text-xs">√x</button>
              <button onClick={() => handleInput('!')} className="btn-calc bg-slate-800/40 hover:bg-slate-700 text-slate-300 text-xs">n!</button>

              {/* Row 4: Constants & Brackets */}
              <button onClick={() => handleInput('π')} className="btn-calc bg-slate-800/40 hover:bg-slate-700 text-amber-300 font-semibold text-xs">π</button>
              <button onClick={() => handleInput('e')} className="btn-calc bg-slate-800/40 hover:bg-slate-700 text-amber-300 font-semibold text-xs">e</button>
              <button onClick={() => handleInput('(')} className="btn-calc bg-slate-800/40 hover:bg-slate-700 text-slate-300 text-xs">(</button>
              <button onClick={() => handleInput(')')} className="btn-calc bg-slate-800/40 hover:bg-slate-700 text-slate-300 text-xs">)</button>
              <button onClick={handleDelete} className="btn-calc bg-rose-950/50 hover:bg-rose-900 border border-rose-800/60 text-rose-300 font-bold text-xs">DEL</button>

              {/* Row 5: Numbers 7 8 9 / Clear */}
              <button onClick={() => handleInput('7')} className="btn-calc bg-slate-900 hover:bg-slate-800 text-white font-bold text-base">7</button>
              <button onClick={() => handleInput('8')} className="btn-calc bg-slate-900 hover:bg-slate-800 text-white font-bold text-base">8</button>
              <button onClick={() => handleInput('9')} className="btn-calc bg-slate-900 hover:bg-slate-800 text-white font-bold text-base">9</button>
              <button onClick={() => handleInput('÷')} className="btn-calc bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 font-bold text-lg">÷</button>
              <button onClick={handleClear} className="btn-calc bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs">AC</button>

              {/* Row 6: Numbers 4 5 6 * % */}
              <button onClick={() => handleInput('4')} className="btn-calc bg-slate-900 hover:bg-slate-800 text-white font-bold text-base">4</button>
              <button onClick={() => handleInput('5')} className="btn-calc bg-slate-900 hover:bg-slate-800 text-white font-bold text-base">5</button>
              <button onClick={() => handleInput('6')} className="btn-calc bg-slate-900 hover:bg-slate-800 text-white font-bold text-base">6</button>
              <button onClick={() => handleInput('×')} className="btn-calc bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 font-bold text-lg">×</button>
              <button onClick={() => handleInput('%')} className="btn-calc bg-slate-800/40 hover:bg-slate-700 text-slate-300 text-xs">%</button>

              {/* Row 7: Numbers 1 2 3 - Ans */}
              <button onClick={() => handleInput('1')} className="btn-calc bg-slate-900 hover:bg-slate-800 text-white font-bold text-base">1</button>
              <button onClick={() => handleInput('2')} className="btn-calc bg-slate-900 hover:bg-slate-800 text-white font-bold text-base">2</button>
              <button onClick={() => handleInput('3')} className="btn-calc bg-slate-900 hover:bg-slate-800 text-white font-bold text-base">3</button>
              <button onClick={() => handleInput('-')} className="btn-calc bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 font-bold text-lg">-</button>
              <button onClick={() => prevAns !== null && handleInput(prevAns.toString())} className="btn-calc bg-slate-800/60 hover:bg-slate-700 text-emerald-400 font-bold text-xs">Ans</button>

              {/* Row 8: 0 . +/- + = */}
              <button onClick={() => handleInput('0')} className="btn-calc bg-slate-900 hover:bg-slate-800 text-white font-bold text-base">0</button>
              <button onClick={() => handleInput('.')} className="btn-calc bg-slate-900 hover:bg-slate-800 text-white font-bold text-base">.</button>
              <button onClick={() => {
                if (display.startsWith('-')) setDisplay(display.slice(1));
                else if (display !== '0') setDisplay('-' + display);
              }} className="btn-calc bg-slate-800/60 hover:bg-slate-700 text-slate-300 text-xs">±</button>
              <button onClick={() => handleInput('+')} className="btn-calc bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 font-bold text-lg">+</button>
              <button onClick={() => evaluateExpression(expression || display)} className="btn-calc bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xl shadow-lg shadow-emerald-600/30">=</button>
            </div>
          </div>

          {/* Right Column: Quick Constants & History */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Quick Scientific Constants Palette */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Atom size={16} className="text-amber-400" />
                  Key Physics & Chem Constants
                </h3>
                <button
                  onClick={() => setActiveTab('library')}
                  className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300"
                >
                  View All →
                </button>
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {SCIENTIFIC_CONSTANTS.slice(0, 6).map((c) => (
                  <div
                    key={c.id}
                    className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 flex items-center justify-between transition-all group"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-amber-400 font-mono">{c.symbol}</span>
                        <span className="text-xs font-bold text-white truncate max-w-[130px]">{c.name}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{c.valueFormatted} {c.unit}</p>
                    </div>

                    <button
                      onClick={() => handleInsertConstant(c.value, c.name)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-[10px] font-bold transition-all shrink-0"
                    >
                      + Insert
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculation History */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <History size={16} className="text-indigo-400" />
                  Calculation History
                </h3>
                {historyList.length > 0 && (
                  <button
                    onClick={() => setHistoryList([])}
                    className="text-[10px] text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    Clear History
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                {historyList.length > 0 ? (
                  historyList.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setDisplay(item.result);
                        setExpression(item.result);
                      }}
                      className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition-all space-y-0.5 group"
                    >
                      <p className="text-[11px] font-mono text-slate-400 text-right truncate">{item.expr}</p>
                      <p className="text-sm font-bold font-mono text-white text-right group-hover:text-indigo-400">{item.result}</p>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-500 italic text-xs">
                    No recent calculations.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- TAB 2: EQUATION SOLVER --- */}
      {activeTab === 'solver' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Quadratic Solver */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Sigma size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Quadratic Equation Solver</h2>
                <p className="text-xs text-slate-400">ax² + bx + c = 0 (দ্বিঘাত সমীকরণ)</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">a (x² Coeff)</label>
                <input
                  type="number"
                  value={quadA}
                  onChange={(e) => setQuadA(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">b (x Coeff)</label>
                <input
                  type="number"
                  value={quadB}
                  onChange={(e) => setQuadB(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">c (Constant)</label>
                <input
                  type="number"
                  value={quadC}
                  onChange={(e) => setQuadC(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              onClick={solveQuadratic}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/20"
            >
              Solve Roots & Discriminant
            </button>

            {quadResult && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 pb-2 border-b border-slate-800">
                  <span>Discriminant (Δ = b² - 4ac):</span>
                  <span className="font-mono text-indigo-400">{quadResult.disc}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Root x₁</p>
                    <p className="text-base font-bold font-mono text-emerald-400 mt-0.5">{quadResult.x1}</p>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Root x₂</p>
                    <p className="text-base font-bold font-mono text-emerald-400 mt-0.5">{quadResult.x2}</p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 pt-1">Parabola Vertex: <span className="text-white font-mono">{quadResult.vertex}</span></p>
              </div>
            )}
          </div>

          {/* System of Linear Equations Solver */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Binary size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">2-Variable Linear System</h2>
                <p className="text-xs text-slate-400">a₁x + b₁y = c₁ & a₂x + b₂y = c₂</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono">
                <input type="number" value={linA1} onChange={(e) => setLinA1(e.target.value)} className="w-16 bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-center" />
                <span className="text-slate-400">x +</span>
                <input type="number" value={linB1} onChange={(e) => setLinB1(e.target.value)} className="w-16 bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-center" />
                <span className="text-slate-400">y =</span>
                <input type="number" value={linC1} onChange={(e) => setLinC1(e.target.value)} className="w-16 bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-center" />
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <input type="number" value={linA2} onChange={(e) => setLinA2(e.target.value)} className="w-16 bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-center" />
                <span className="text-slate-400">x +</span>
                <input type="number" value={linB2} onChange={(e) => setLinB2(e.target.value)} className="w-16 bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-center" />
                <span className="text-slate-400">y =</span>
                <input type="number" value={linC2} onChange={(e) => setLinC2(e.target.value)} className="w-16 bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-center" />
              </div>
            </div>

            <button
              onClick={solveLinearSystem}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-md shadow-purple-600/20"
            >
              Solve System (x, y)
            </button>

            {linResult && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 gap-3">
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Variable x</p>
                  <p className="text-base font-bold font-mono text-purple-400 mt-0.5">{linResult.x}</p>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Variable y</p>
                  <p className="text-base font-bold font-mono text-purple-400 mt-0.5">{linResult.y}</p>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* --- TAB 3: UNIT CONVERTER --- */}
      {activeTab === 'converter' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Scale size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Universal Unit Converter</h2>
              <p className="text-xs text-slate-400">Convert physical quantities for SSC & HSC numerical problems</p>
            </div>
          </div>

          {/* Unit Category Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {(['Temperature', 'Length', 'Mass', 'Energy', 'Pressure'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setConvCategory(cat);
                  if (cat === 'Temperature') { setConvFrom('Celsius'); setConvTo('Fahrenheit'); }
                  if (cat === 'Length') { setConvFrom('Meter'); setConvTo('Kilometer'); }
                  if (cat === 'Energy') { setConvFrom('Joule'); setConvTo('eV'); }
                  if (cat === 'Pressure') { setConvFrom('atm'); setConvTo('mmHg / Torr'); }
                }}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border",
                  convCategory === cat
                    ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Conversion Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">From Quantity</label>
              <input
                type="number"
                value={convVal}
                onChange={(e) => setConvVal(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-base font-mono text-white focus:outline-none focus:border-amber-500"
              />
              <select
                value={convFrom}
                onChange={(e) => setConvFrom(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none"
              >
                {convCategory === 'Temperature' && ['Celsius', 'Fahrenheit', 'Kelvin'].map(u => <option key={u}>{u}</option>)}
                {convCategory === 'Length' && ['Meter', 'Kilometer', 'Centimeter', 'Millimeter', 'Nanometer', 'Angstrom'].map(u => <option key={u}>{u}</option>)}
                {convCategory === 'Energy' && ['Joule', 'eV', 'Calorie', 'kWh'].map(u => <option key={u}>{u}</option>)}
                {convCategory === 'Pressure' && ['atm', 'Pascal', 'mmHg / Torr', 'Bar'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">To Converted Value</label>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-base font-mono text-amber-400 font-extrabold min-h-[48px] flex items-center">
                {convResult}
              </div>
              <select
                value={convTo}
                onChange={(e) => setConvTo(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none"
              >
                {convCategory === 'Temperature' && ['Celsius', 'Fahrenheit', 'Kelvin'].map(u => <option key={u}>{u}</option>)}
                {convCategory === 'Length' && ['Meter', 'Kilometer', 'Centimeter', 'Millimeter', 'Nanometer', 'Angstrom'].map(u => <option key={u}>{u}</option>)}
                {convCategory === 'Energy' && ['Joule', 'eV', 'Calorie', 'kWh'].map(u => <option key={u}>{u}</option>)}
                {convCategory === 'Pressure' && ['atm', 'Pascal', 'mmHg / Torr', 'Bar'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 4: SSC & HSC FORMULAS LIBRARY --- */}
      {activeTab === 'library' && (
        <div className="space-y-6">
          
          {/* Controls & Search */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Level & Subject Filters */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                {(['All', 'SSC', 'HSC'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setSelectedLevel(lvl)}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                      selectedLevel === lvl
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-white"
                    )}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                {(['All', 'Physics', 'Chemistry', 'Math'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                      selectedCategory === cat
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-white"
                    )}
                  >
                    {cat === 'All' ? 'All Subjects' : cat === 'Physics' ? 'পদার্থ' : cat === 'Chemistry' ? 'রসায়ন' : 'উচ্চতর গণিত'}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-72">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search formula (e.g. F = ma, Ohm, pH)..."
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* SECTION 1: SCIENTIFIC CONSTANTS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Atom size={18} />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Fundamental Constants (ধ্রুবকের মান)
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredConstants.map((c) => (
                <div
                  key={c.id}
                  className="glass-panel p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-base font-extrabold text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                        {c.symbol}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                        {c.level} • {c.category}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white leading-tight">{c.name} <span className="text-slate-400 text-xs font-normal">({c.nameBn})</span></h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{c.description}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">Value</p>
                      <p className="text-sm font-bold font-mono text-emerald-400">{c.valueFormatted} <span className="text-xs font-normal text-slate-400">{c.unit}</span></p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopy(`${c.name} (${c.symbol}) = ${c.value} ${c.unit}`, c.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="Copy Constant"
                      >
                        {copiedId === c.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>

                      <button
                        onClick={() => handleInsertConstant(c.value, c.name)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
                      >
                        + Insert into Calc
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2: IMPORTANT SSC/HSC FORMULAS */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Sigma size={18} />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                SSC & HSC Important Formulas (গুরুত্বপূর্ণ সূত্রাবলী)
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFormulas.map((f) => (
                <div
                  key={f.id}
                  className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                        {f.level} • {f.category} ({f.subCategory})
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white">{f.title}</h3>
                      <p className="text-xs text-indigo-300 font-medium">{f.titleBn}</p>
                      <p className="text-xs text-slate-400 mt-1">{f.explanation}</p>
                    </div>

                    {/* Formula Display Box */}
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-lg font-extrabold font-mono text-indigo-300 tracking-wide">
                        {f.formula}
                      </span>
                    </div>

                    {/* Variables */}
                    <div className="pt-2 space-y-1">
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">Variables Explained:</p>
                      <div className="flex flex-wrap gap-2">
                        {f.variables.map((v, idx) => (
                          <span key={idx} className="text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                            <strong className="text-amber-400">{v.symbol}</strong>: {v.name} ({v.unit})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <button
                      onClick={() => handleCopy(`${f.title}: ${f.formula}`, f.id)}
                      className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <Copy size={13} />
                      Copy Formula
                    </button>

                    <button
                      onClick={() => {
                        setActiveFormulaModal(f);
                        setFormulaInputs({});
                        setFormulaCalculatedResult(null);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
                    >
                      <Zap size={13} />
                      Solve with Formula
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* --- FORMULA SOLVE INTERACTIVE MODAL --- */}
      <AnimatePresence>
        {activeFormulaModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-white">{activeFormulaModal.title}</h3>
                  <p className="text-xs text-indigo-400 font-semibold">{activeFormulaModal.formula}</p>
                </div>
                <button
                  onClick={() => setActiveFormulaModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Enter known variable values below to compute parameters automatically for your physics/math numerical:
              </p>

              <div className="space-y-3">
                {activeFormulaModal.variables.map((v) => (
                  <div key={v.symbol} className="flex items-center justify-between gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-xs font-bold text-amber-400 font-mono w-24 truncate">{v.symbol} ({v.unit})</span>
                    <input
                      type="number"
                      placeholder={`Enter ${v.name}...`}
                      value={formulaInputs[v.symbol] || ''}
                      onChange={(e) => setFormulaInputs({ ...formulaInputs, [v.symbol]: e.target.value })}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                ))}
              </div>

              {/* Instant Auto Calculation Button */}
              <button
                onClick={() => {
                  try {
                    // Demo auto evaluator for basic physics formulas
                    if (activeFormulaModal.id === 'ssc_p1') {
                      // F = m * a
                      const m = parseFloat(formulaInputs['m']);
                      const a = parseFloat(formulaInputs['a']);
                      if (!isNaN(m) && !isNaN(a)) setFormulaCalculatedResult(`Resulting Force F = ${m * a} N`);
                      else setFormulaCalculatedResult('Please enter valid m and a numbers.');
                    } else if (activeFormulaModal.id === 'ssc_p2') {
                      // v = u + at
                      const u = parseFloat(formulaInputs['u']);
                      const a = parseFloat(formulaInputs['a']);
                      const t = parseFloat(formulaInputs['t']);
                      if (!isNaN(u) && !isNaN(a) && !isNaN(t)) setFormulaCalculatedResult(`Final Velocity v = ${u + a * t} m/s`);
                      else setFormulaCalculatedResult('Please enter u, a, and t values.');
                    } else if (activeFormulaModal.id === 'ssc_p5') {
                      // V = I * R
                      const I = parseFloat(formulaInputs['I']);
                      const R = parseFloat(formulaInputs['R']);
                      if (!isNaN(I) && !isNaN(R)) setFormulaCalculatedResult(`Voltage V = ${I * R} Volts`);
                      else setFormulaCalculatedResult('Please enter I and R values.');
                    } else {
                      setFormulaCalculatedResult('Formula variables processed! You can copy the values directly to the main calculator for evaluation.');
                    }
                  } catch (e) {
                    setFormulaCalculatedResult('Calculation error.');
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/20"
              >
                Compute Result
              </button>

              {formulaCalculatedResult && (
                <div className="p-3 bg-indigo-950/60 border border-indigo-500/30 rounded-xl text-center font-mono text-sm font-bold text-indigo-300">
                  {formulaCalculatedResult}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Styled custom CSS for calc buttons */}
      <style>{`
        .btn-calc {
          @apply p-3.5 rounded-xl flex items-center justify-center transition-all active:scale-95 border border-slate-800/80 select-none;
        }
      `}</style>
    </div>
  );
}

export interface BreathingPattern {
  id: string;
  name: string;
  description: string;
  phases: BreathingPhase[];
  culturalOrigin: string;
  benefits: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface BreathingPhase {
  name: string;
  duration: number;
  instruction: string;
  color: string;
}

export const BREATHING_PATTERNS: BreathingPattern[] = [
  {
    id: 'box-breathing',
    name: 'Box Breathing',
    description: 'A calming technique used by Navy SEALs and yogis for stress reduction and focus.',
    culturalOrigin: 'Ancient Indian Pranayama',
    benefits: ['Reduces stress', 'Improves focus', 'Calms nervous system'],
    difficulty: 'beginner',
    phases: [
      { name: 'inhale', duration: 4, instruction: 'Breathe in slowly through your nose', color: '#4CAF50' },
      { name: 'hold', duration: 4, instruction: 'Hold the breath gently', color: '#FF9800' },
      { name: 'exhale', duration: 4, instruction: 'Release the breath slowly', color: '#F44336' },
      { name: 'hold-empty', duration: 4, instruction: 'Rest in the empty space', color: '#9C27B0' }
    ]
  },
  {
    id: '4-7-8-breathing',
    name: '4-7-8 Breathing',
    description: 'A natural tranquilizer for the nervous system, promoting deep relaxation.',
    culturalOrigin: 'Dr. Andrew Weil (based on ancient yogic techniques)',
    benefits: ['Induces sleep', 'Reduces anxiety', 'Manages cravings'],
    difficulty: 'beginner',
    phases: [
      { name: 'inhale', duration: 4, instruction: 'Inhale quietly through your nose', color: '#4CAF50' },
      { name: 'hold', duration: 7, instruction: 'Hold your breath', color: '#FF9800' },
      { name: 'exhale', duration: 8, instruction: 'Exhale completely through your mouth', color: '#F44336' }
    ]
  },
  {
    id: 'alternate-nostril',
    name: 'Alternate Nostril Breathing',
    description: 'Balances the left and right hemispheres of the brain, promoting mental clarity.',
    culturalOrigin: 'Ancient Indian Pranayama (Nadi Shodhana)',
    benefits: ['Balances energy', 'Improves concentration', 'Reduces mental fatigue'],
    difficulty: 'intermediate',
    phases: [
      { name: 'inhale-left', duration: 4, instruction: 'Inhale through left nostril', color: '#4CAF50' },
      { name: 'hold', duration: 4, instruction: 'Hold breath', color: '#FF9800' },
      { name: 'exhale-right', duration: 4, instruction: 'Exhale through right nostril', color: '#F44336' },
      { name: 'inhale-right', duration: 4, instruction: 'Inhale through right nostril', color: '#4CAF50' },
      { name: 'hold', duration: 4, instruction: 'Hold breath', color: '#FF9800' },
      { name: 'exhale-left', duration: 4, instruction: 'Exhale through left nostril', color: '#F44336' }
    ]
  },
  {
    id: 'ocean-breath',
    name: 'Ocean Breath',
    description: 'Creates a soothing sound like ocean waves, calming the mind and body.',
    culturalOrigin: 'Ancient Indian Pranayama (Ujjayi)',
    benefits: ['Calms mind', 'Reduces stress', 'Improves focus'],
    difficulty: 'intermediate',
    phases: [
      { name: 'inhale', duration: 5, instruction: 'Inhale with gentle throat constriction', color: '#4CAF50' },
      { name: 'exhale', duration: 5, instruction: 'Exhale with ocean-like sound', color: '#F44336' }
    ]
  },
  {
    id: 'triangle-breathing',
    name: 'Triangle Breathing',
    description: 'A simple pattern that creates a sense of stability and grounding.',
    culturalOrigin: 'Modern meditation (inspired by ancient practices)',
    benefits: ['Grounding', 'Stability', 'Stress reduction'],
    difficulty: 'beginner',
    phases: [
      { name: 'inhale', duration: 3, instruction: 'Inhale slowly and steadily', color: '#4CAF50' },
      { name: 'hold', duration: 3, instruction: 'Hold with awareness', color: '#FF9800' },
      { name: 'exhale', duration: 3, instruction: 'Release completely', color: '#F44336' }
    ]
  },
  {
    id: 'square-breathing',
    name: 'Square Breathing',
    description: 'Creates a balanced, square pattern that promotes mental clarity and emotional stability.',
    culturalOrigin: 'Modern stress management (inspired by ancient techniques)',
    benefits: ['Mental clarity', 'Emotional balance', 'Stress reduction'],
    difficulty: 'beginner',
    phases: [
      { name: 'inhale', duration: 4, instruction: 'Inhale to fill your lungs', color: '#4CAF50' },
      { name: 'hold-full', duration: 4, instruction: 'Hold with full lungs', color: '#FF9800' },
      { name: 'exhale', duration: 4, instruction: 'Exhale completely', color: '#F44336' },
      { name: 'hold-empty', duration: 4, instruction: 'Hold with empty lungs', color: '#9C27B0' }
    ]
  }
];

export const getBreathingPattern = (id: string): BreathingPattern | undefined => {
  return BREATHING_PATTERNS.find(pattern => pattern.id === id);
};

export const getDefaultPattern = (): BreathingPattern => {
  return BREATHING_PATTERNS[0]; // Box Breathing
}; 
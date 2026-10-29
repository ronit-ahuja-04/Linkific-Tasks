/**
 * Pure functions for Teams station form validation & data helpers (TM-1 to TM-8)
 */

export const HACKATHON_TRACKS = [
  { id: 'ai-ml', name: 'AI & Machine Learning', color: '#2F5BFF' },
  { id: 'web3', name: 'Web3 & Decentralized Systems', color: '#FFC93C' },
  { id: 'fintech', name: 'FinTech & Open Banking', color: '#0F7A64' },
  { id: 'open', name: 'Open Innovation & Social Impact', color: '#9B51E0' },
];

export const AVAILABLE_INTERESTS = [
  'Generative AI',
  'Autonomous Agents',
  'Smart Contracts',
  'High-Scale Microservices',
  'Mobile & React Native',
  'Cybersecurity & Privacy',
];

export const MEMBER_ROLES = [
  'Team Lead',
  'Frontend Engineer',
  'Backend Engineer',
  'UI/UX Designer',
  'Fullstack Engineer',
  'AI / ML Specialist',
];

export function getInitialTeamForm() {
  return {
    teamName: '',
    track: 'ai-ml',
    members: [
      { id: 'm-1', name: '', role: 'Team Lead' },
    ],
    contact: {
      email: '',
      phone: '',
      city: '',
    },
    interests: [],
    agreed: false,
  };
}

export function getSampleTeamData() {
  return {
    teamName: 'Hyperion Labs',
    track: 'ai-ml',
    members: [
      { id: 'm-sample-1', name: 'Ronit Ahuja', role: 'Team Lead' },
      { id: 'm-sample-2', name: 'Aarav Sharma', role: 'Fullstack Engineer' },
      { id: 'm-sample-3', name: 'Priya Iyer', role: 'UI/UX Designer' },
    ],
    contact: {
      email: 'ronit@hyperionlabs.dev',
      phone: '9876543210',
      city: 'Bengaluru',
    },
    interests: ['Generative AI', 'Autonomous Agents', 'High-Scale Microservices'],
    agreed: true,
  };
}

/**
 * Validate email format with standard RFC regex
 */
export function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/**
 * Validate 10-digit phone format when provided (optional)
 */
export function isValidPhone(phone) {
  if (!phone || phone.trim() === '') return true; // Phone is optional
  const clean = phone.replace(/[\s-]/g, '');
  return /^\d{10}$/.test(clean);
}

/**
 * Check for duplicate team name (case-insensitive) (TM-7)
 */
export function isDuplicateTeamName(name, registeredTeams = []) {
  if (!name || typeof name !== 'string') return false;
  const target = name.trim().toLowerCase();
  return registeredTeams.some(
    (t) => (t.teamName || '').trim().toLowerCase() === target
  );
}

/**
 * Pure validation engine for Team Registration (TM-5)
 * Returns object containing field-specific errors and overall validity
 */
export function validateTeam(values, registeredTeams = []) {
  const errors = {};

  if (!values) {
    return { isValid: false, errors: { form: 'Form values are required.' } };
  }

  // 1. Team Name (3 to 30 characters, unique)
  const trimmedName = (values.teamName || '').trim();
  if (!trimmedName) {
    errors.teamName = 'Team name is required.';
  } else if (trimmedName.length < 3) {
    errors.teamName = 'Team name needs at least 3 characters.';
  } else if (trimmedName.length > 30) {
    errors.teamName = 'Team name cannot exceed 30 characters.';
  } else if (isDuplicateTeamName(trimmedName, registeredTeams)) {
    errors.teamName = `A team named "${trimmedName}" has already registered.`;
  }

  // 2. Track selection
  if (!values.track) {
    errors.track = 'Please select a hackathon track.';
  }

  // 3. Contact object validation
  const contact = values.contact || {};
  const email = (contact.email || '').trim();
  if (!email) {
    errors['contact.email'] = 'Contact email is required.';
  } else if (!isValidEmail(email)) {
    errors['contact.email'] = 'Please enter a valid contact email address.';
  }

  const phone = contact.phone || '';
  if (phone && !isValidPhone(phone)) {
    errors['contact.phone'] = 'Enter a 10-digit phone number or leave it blank.';
  }

  const city = (contact.city || '').trim();
  if (!city) {
    errors['contact.city'] = 'City is required.';
  } else if (city.length < 2) {
    errors['contact.city'] = 'City name needs at least 2 characters.';
  }

  // 4. Members validation (1 to 4 members, name >= 2 chars, role required)
  const members = values.members || [];
  if (members.length === 0) {
    errors.members = 'At least 1 team member is required.';
  } else if (members.length > 4) {
    errors.members = 'A team cannot have more than 4 members.';
  } else {
    members.forEach((m, idx) => {
      const mName = (m.name || '').trim();
      if (!mName) {
        errors[`members.${idx}.name`] = `Member ${idx + 1} name is required.`;
      } else if (mName.length < 2) {
        errors[`members.${idx}.name`] = `Member ${idx + 1} name needs at least 2 characters.`;
      }
    });
  }

  // 5. Code of conduct agreement
  if (!values.agreed) {
    errors.agreed = 'You must accept the hackathon code of conduct.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}


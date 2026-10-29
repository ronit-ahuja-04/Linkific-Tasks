import { describe, it, expect } from 'vitest';
import {
  validateTeam,
  isValidEmail,
  isValidPhone,
  isDuplicateTeamName,
  getInitialTeamForm,
  getSampleTeamData,
} from '../src/lib/validation.js';

describe('Teams station validation pure logic (src/lib/validation.js)', () => {
  describe('isValidEmail', () => {
    it('validates standard email addresses', () => {
      expect(isValidEmail('ronit@linkific.org')).toBe(true);
      expect(isValidEmail('lead.developer+test@domain.co.in')).toBe(true);
    });

    it('rejects invalid email formats', () => {
      expect(isValidEmail('plainaddress')).toBe(false);
      expect(isValidEmail('@missingusername.com')).toBe(false);
      expect(isValidEmail('missing@domain')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('accepts valid 10-digit phone numbers', () => {
      expect(isValidPhone('9876543210')).toBe(true);
      expect(isValidPhone('987-654-3210')).toBe(true);
    });

    it('allows empty or blank phone since it is optional', () => {
      expect(isValidPhone('')).toBe(true);
      expect(isValidPhone(null)).toBe(true);
    });

    it('rejects numbers with incorrect digit counts', () => {
      expect(isValidPhone('12345')).toBe(false);
      expect(isValidPhone('987654321099')).toBe(false);
      expect(isValidPhone('abcdefghij')).toBe(false);
    });
  });

  describe('isDuplicateTeamName', () => {
    const existing = [
      { teamName: 'Byte Bandits' },
      { teamName: 'Neural Net Ninjas' },
    ];

    it('detects duplicate team names case-insensitively', () => {
      expect(isDuplicateTeamName('Byte Bandits', existing)).toBe(true);
      expect(isDuplicateTeamName('byte bandits', existing)).toBe(true);
      expect(isDuplicateTeamName('  BYTE BANDITS  ', existing)).toBe(true);
    });

    it('permits new unique team names', () => {
      expect(isDuplicateTeamName('Quantum Questers', existing)).toBe(false);
    });
  });

  describe('validateTeam', () => {
    it('validates sample team data successfully with 0 errors', () => {
      const sample = getSampleTeamData();
      const res = validateTeam(sample, []);
      expect(res.isValid).toBe(true);
      expect(Object.keys(res.errors)).toHaveLength(0);
    });

    it('fails when initial form has missing mandatory fields', () => {
      const initial = getInitialTeamForm();
      const res = validateTeam(initial, []);
      expect(res.isValid).toBe(false);
      expect(res.errors.teamName).toBe('Team name is required.');
      expect(res.errors['contact.email']).toBe('Contact email is required.');
      expect(res.errors['contact.city']).toBe('City is required.');
      expect(res.errors['members.0.name']).toBe('Member 1 name is required.');
      expect(res.errors.agreed).toBe('You must accept the hackathon code of conduct.');
    });

    it('catches team name length constraints', () => {
      const data = {
        ...getSampleTeamData(),
        teamName: 'ab',
      };
      const res = validateTeam(data, []);
      expect(res.errors.teamName).toBe('Team name needs at least 3 characters.');
    });

    it('prevents registering duplicate team names', () => {
      const data = getSampleTeamData();
      const existing = [{ teamName: 'Hyperion Labs' }];
      const res = validateTeam(data, existing);
      expect(res.isValid).toBe(false);
      expect(res.errors.teamName).toBe('A team named "Hyperion Labs" has already registered.');
    });

    it('validates member count limits (1 to 4)', () => {
      const data = {
        ...getSampleTeamData(),
        members: [],
      };
      const emptyRes = validateTeam(data, []);
      expect(emptyRes.errors.members).toBe('At least 1 team member is required.');

      const fiveMembers = {
        ...getSampleTeamData(),
        members: [
          { name: 'M1', role: 'Lead' },
          { name: 'M2', role: 'Dev' },
          { name: 'M3', role: 'Dev' },
          { name: 'M4', role: 'Dev' },
          { name: 'M5', role: 'Dev' },
        ],
      };
      const fiveRes = validateTeam(fiveMembers, []);
      expect(fiveRes.errors.members).toBe('A team cannot have more than 4 members.');
    });
  });
});

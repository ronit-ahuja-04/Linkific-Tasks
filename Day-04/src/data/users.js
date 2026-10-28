/**
 * Sample user dataset for DevHub.
 * Each user has a guaranteed unique, stable `id` for list reconciliation keys.
 */
export const users = [
  {
    id: 'usr-101',
    name: 'Ronit Ahuja',
    role: 'Frontend Engineer & React Specialist',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    isOnline: true,
    bio: 'Building accessible, high-performance web applications and design systems.',
    location: 'Bengaluru, India',
    github: 'ronit-ahuja-04',
  },
  {
    id: 'usr-102',
    name: 'Priya Sharma',
    role: 'Full Stack Developer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    isOnline: true,
    bio: 'Passionate about Node.js microservices, GraphQL, and modern CSS.',
    location: 'Mumbai, India',
    github: 'priyasharma',
  },
  {
    id: 'usr-103',
    name: 'Alex Chen',
    role: 'UI/UX Designer & Prototyper',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    isOnline: false,
    bio: 'Obsessed with typography, spacing rhythm, and fluid animations.',
    location: 'Singapore',
    github: 'alexchendesign',
  },
  {
    id: 'usr-104',
    name: 'Sarah Jenkins',
    role: 'Cloud Architect & SRE',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    isOnline: true,
    bio: 'Kubernetes enthusiast, CI/CD automation builder, and Docker ninja.',
    location: 'Austin, TX',
    github: 'sarahcloud',
  },
  {
    id: 'usr-105',
    name: 'Michael Torres',
    role: 'Backend Systems Engineer',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    isOnline: false,
    bio: 'Distributed systems, database tuning, and distributed streaming pipelines.',
    location: 'Seattle, WA',
    github: 'mtorres-dev',
  },
  {
    id: 'usr-106',
    name: 'Aisha Patel',
    role: 'Machine Learning Engineer',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=200&q=80',
    isOnline: true,
    bio: 'Fine-tuning LLMs and developing client-side embeddings on edge devices.',
    location: 'London, UK',
    github: 'aishaml',
  },
];

export default users;

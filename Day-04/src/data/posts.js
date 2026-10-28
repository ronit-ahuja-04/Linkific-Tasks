/**
 * Sample technical blog post dataset for DevHub.
 * Proves complex props: nested author objects, date strings, and topic tag arrays.
 */
export const posts = [
  {
    id: 'post-101',
    title: 'Migrating to React 19: Action Hooks, Server Components & What Changed',
    excerpt: 'An in-depth guide to modern React primitives, including why defaultProps was removed and how compiler optimizations impact rendering performance.',
    coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=600&q=80',
    date: 'Oct 28, 2026',
    readTime: '6 min read',
    tags: ['React 19', 'Architecture', 'Web Dev'],
    featured: true,
    author: {
      name: 'Ronit Ahuja',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      role: 'Frontend Lead',
    },
  },
  {
    id: 'post-102',
    title: 'Mastering JSX: Beyond HTML and into Pure JavaScript Expressions',
    excerpt: 'Deconstructing JSX compilation down to createElement calls, understanding the count && <X /> zero trap, and harnessing React Fragments effectively.',
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
    date: 'Oct 26, 2026',
    readTime: '4 min read',
    tags: ['JSX', 'JavaScript', 'Fundamentals'],
    featured: false,
    author: {
      name: 'Priya Sharma',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      role: 'Full Stack Dev',
    },
  },
  {
    id: 'post-103',
    title: 'Why Reconciliation Keys Must Be Stable and Unique',
    excerpt: 'Examining React Fiber list reconciliation: why array indices cause input state bleed, animation glitches, and broken re-ordering.',
    coverImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80',
    date: 'Oct 24, 2026',
    readTime: '5 min read',
    tags: ['Performance', 'Virtual DOM', 'Reconciliation'],
    featured: false,
    author: {
      name: 'Michael Torres',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      role: 'Backend Architect',
    },
  },
  {
    id: 'post-104',
    title: 'Design Systems with Pure Component Composition & Children',
    excerpt: 'How creating generic Card, Button, and Layout primitives eliminates prop drilling and empowers scalable UI development.',
    coverImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80',
    date: 'Oct 21, 2026',
    readTime: '7 min read',
    tags: ['Design Systems', 'Composition', 'CSS'],
    featured: true,
    author: {
      name: 'Alex Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      role: 'UI/UX Designer',
    },
  },
];

export default posts;

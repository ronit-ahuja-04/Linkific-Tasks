import { useState } from 'react';
import Navbar from './components/Navbar';
import Button from './components/Button';
import SectionHeader from './components/SectionHeader';
import UserList from './components/UserList';
import ProductList from './components/ProductList';
import BlogPostList from './components/BlogPostList';
import JsxFeaturesDemo from './components/JsxFeaturesDemo';
import PropTypesDemoCard from './components/PropTypesDemoCard';
import Footer from './components/Footer';

import usersData from './data/users';
import productsData from './data/products';
import postsData from './data/posts';

import './App.css';

/**
 * App (Root Component)
 *
 * DevHub Developer Platform:
 * - High-level component tree composition and hierarchy
 * - 16 distinct modular React components working harmoniously
 * - Clean prop delegation, callbacks, state filtering, and slot composition
 * - Unidirectional data flow and pure derived state
 */
function App() {
  const [filterOnlineOnly, setFilterOnlineOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [simulateEmptyProducts, setSimulateEmptyProducts] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // Navigation items for Navbar (complex array prop)
  const navLinks = [
    { id: 'nav-network', label: 'Network', href: '#network' },
    { id: 'nav-tooling', label: 'Tooling', href: '#tooling' },
    { id: 'nav-publications', label: 'Publications', href: '#publications' },
    { id: 'nav-jsx-studio', label: 'JSX Studio', href: '#jsx-studio' },
    { id: 'nav-contracts', label: 'Type Safety', href: '#type-safety' },
  ];

  // Filtered users demonstrating pure derived state without extra re-renders
  const displayedUsers = filterOnlineOnly
    ? usersData.filter((user) => user.isOnline)
    : usersData;

  // Filtered products or simulated empty state
  const displayedProducts = simulateEmptyProducts
    ? []
    : selectedCategory === 'All'
    ? productsData
    : productsData.filter((item) => item.category === selectedCategory);

  const categories = ['All', 'Templates', 'Hardware', 'Books', 'Assets', 'Education'];

  const handleAddToCart = (product) => {
    setCartCount((prev) => prev + 1);
    alert(`Added "${product.name}" ($${product.price}) to cart! Total items: ${cartCount + 1}`);
  };

  const handleConnectUser = (userName) => {
    alert(`Connection request sent to ${userName}!`);
  };

  return (
    <div className="app-container">
      {/* 1. Header & Navigation primitive */}
      <Navbar
        brand="DevHub"
        links={navLinks}
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => alert(`Shopping cart contains ${cartCount} items.`)}
          >
            🛒 Cart ({cartCount})
          </Button>
        }
      />

      {/* Hero Header */}
      <header className="app-hero">
        <div className="hero-content">
          <span className="hero-badge">✦ NEXT-GENERATION DEVELOPER PLATFORM</span>
          <h1 className="hero-title">Where World-Class Engineers Build & Ship</h1>
          <p className="hero-subtitle">
            DevHub unifies specialized developer networking, curated production tooling,
            deep architectural publications, and real-time interactive runtime sandboxes.
          </p>
          <div className="hero-actions">
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                const el = document.getElementById('network');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Explore Network ({usersData.length})
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                const el = document.getElementById('tooling');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Browse Tooling
            </Button>
          </div>

          <div className="hero-metrics-strip">
            <div className="metric-item">
              <span className="metric-value">6+</span>
              <span className="metric-label">Verified Architects</span>
            </div>
            <div className="metric-divider"></div>
            <div className="metric-item">
              <span className="metric-value">6</span>
              <span className="metric-label">Curated Toolkits</span>
            </div>
            <div className="metric-divider"></div>
            <div className="metric-item">
              <span className="metric-value">4</span>
              <span className="metric-label">Technical Publications</span>
            </div>
            <div className="metric-divider"></div>
            <div className="metric-item">
              <span className="metric-value">100%</span>
              <span className="metric-label">Type-Safe Contracts</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Sections */}
      <main className="app-main">
        {/* Section 1: Engineering Network (UserCard & UserList) */}
        <section id="network" className="app-section">
          <SectionHeader
            title="Engineering Network"
            subtitle="Discover and collaborate with verified staff engineers, distributed systems specialists, and core frontend architects."
            action={
              <Button
                variant={filterOnlineOnly ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilterOnlineOnly((prev) => !prev)}
              >
                {filterOnlineOnly ? 'Showing Active Now' : 'Filter: Active Now'}
              </Button>
            }
          />

          <UserList
            users={displayedUsers}
            onConnectUser={handleConnectUser}
          />
        </section>

        {/* Section 2: Curated Developer Tooling (ProductCard, ProductList, EmptyState) */}
        <section id="tooling" className="app-section">
          <SectionHeader
            title="Curated Developer Tooling"
            subtitle="Production starter kits, architectural blueprints, enterprise hardware, and field-tested developer assets."
            action={
              <Button
                variant={simulateEmptyProducts ? 'danger' : 'secondary'}
                size="sm"
                onClick={() => setSimulateEmptyProducts((prev) => !prev)}
              >
                {simulateEmptyProducts ? 'Restore Catalog' : 'Simulate Out of Stock'}
              </Button>
            }
          />

          {!simulateEmptyProducts && (
            <div className="category-filter-bar">
              <span className="filter-label">Filter:</span>
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`category-pill ${selectedCategory === category ? 'is-active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          )}

          <ProductList
            products={displayedProducts}
            onAddToCart={handleAddToCart}
            onResetFilter={() => {
              setSimulateEmptyProducts(false);
              setSelectedCategory('All');
            }}
          />
        </section>

        {/* Section 3: Engineering Publications (BlogPostCard & BlogPostList) */}
        <section id="publications" className="app-section">
          <SectionHeader
            title="Engineering Publications"
            subtitle="In-depth technical papers, architectural decision records, and frontend performance analyses from staff contributors."
          />

          <BlogPostList
            posts={postsData}
            onReadMore={(post) => alert(`Reading article: "${post.title}" by ${post.author.name}`)}
          />
        </section>

        {/* Section 4: Interactive JSX Compilation Studio (JsxFeaturesDemo) */}
        <section id="jsx-studio" className="app-section">
          <SectionHeader
            title="Interactive JSX Compilation Studio"
            subtitle="Live exploration of JSX transpilation semantics, safe expression interpolation, fragment reconciliations, and runtime evaluation boundaries."
          />

          <JsxFeaturesDemo />
        </section>

        {/* Section 5: Schema & Contract Verification Console (PropTypesDemoCard) */}
        <section id="type-safety" className="app-section">
          <SectionHeader
            title="Schema & Contract Verification Console"
            subtitle="Runtime prop contract auditing and development validation suite ensuring robust component API compliance."
          />

          <PropTypesDemoCard />
        </section>
      </main>

      {/* Semantic Footer */}
      <Footer
        text="DevHub Platform · High-velocity developer ecosystem built with React 19, Vite, and modular component architecture."
        year={new Date().getFullYear()}
      />
    </div>
  );
}

export default App;

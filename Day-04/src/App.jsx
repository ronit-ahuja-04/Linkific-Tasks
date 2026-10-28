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
 * Demonstrates:
 * - High-level component tree composition and hierarchy
 * - 16+ distinct modular React components working harmoniously
 * - Clean prop delegation, callbacks, state filtering, and slot composition
 */
function App() {
  const [filterOnlineOnly, setFilterOnlineOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [simulateEmptyProducts, setSimulateEmptyProducts] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // Navigation items for Navbar (complex array prop)
  const navLinks = [
    { id: 'nav-community', label: 'Community', href: '#community' },
    { id: 'nav-store', label: 'Store', href: '#store' },
    { id: 'nav-articles', label: 'Articles', href: '#articles' },
    { id: 'nav-jsx', label: 'JSX Demo', href: '#jsx-rules' },
    { id: 'nav-proptypes', label: 'PropTypes', href: '#proptypes' },
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
      {/* 1. Navbar primitive */}
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
          <span className="hero-badge">React 19 &bull; Vite &bull; 16 Components &bull; Clean Architecture</span>
          <h1 className="hero-title">Developer Hub Showcase</h1>
          <p className="hero-subtitle">
            A comprehensive modular React application demonstrating components,
            props flow, conditional rendering, list reconciliation, and JSX rules.
          </p>
          <div className="hero-actions">
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                const el = document.getElementById('community');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Explore Community ({usersData.length})
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                const el = document.getElementById('proptypes');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              PropTypes in React 19
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Sections */}
      <main className="app-main">
        {/* Section 1: Community Members (UserCard & UserList) */}
        <section id="community" className="app-section">
          <SectionHeader
            title="Community Members"
            subtitle="Demonstrating list rendering with stable keys (key={user.id}), simple props, and conditional status rendering."
            action={
              <Button
                variant={filterOnlineOnly ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilterOnlineOnly((prev) => !prev)}
              >
                {filterOnlineOnly ? 'Showing Online Only' : 'Show All Members'}
              </Button>
            }
          />

          <UserList
            users={displayedUsers}
            onConnectUser={handleConnectUser}
          />
        </section>

        {/* Section 2: Developer Store & Assets (ProductCard, ProductList, EmptyState) */}
        <section id="store" className="app-section">
          <SectionHeader
            title="Developer Tools & Assets"
            subtitle="Demonstrating complex object props, nested array tags, stock badges, and conditional EmptyState fallback."
            action={
              <Button
                variant={simulateEmptyProducts ? 'danger' : 'secondary'}
                size="sm"
                onClick={() => setSimulateEmptyProducts((prev) => !prev)}
              >
                {simulateEmptyProducts ? 'Restore Product Catalog' : 'Simulate Empty Catalog'}
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

        {/* Section 3: Technical Blog Posts (BlogPostCard & BlogPostList) */}
        <section id="articles" className="app-section">
          <SectionHeader
            title="Engineering Articles"
            subtitle="Demonstrating complex nested object props (author, tags, metadata), conditional badges, and list mapping with unique keys."
          />

          <BlogPostList
            posts={postsData}
            onReadMore={(post) => alert(`Reading article: "${post.title}" by ${post.author.name}`)}
          />
        </section>

        {/* Section 4: JSX Syntax Masterclass (JsxFeaturesDemo) */}
        <section id="jsx-rules" className="app-section">
          <SectionHeader
            title="Interactive JSX Masterclass"
            subtitle="Interactive playground demonstrating className, htmlFor, embedded JS expressions, fragments, comments, and the critical zero-count gotcha."
          />

          <JsxFeaturesDemo />
        </section>

        {/* Section 5: PropTypes in React 19 (PropTypesDemoCard) */}
        <section id="proptypes" className="app-section">
          <SectionHeader
            title="Runtime Prop Validation"
            subtitle="Demonstrating PropTypes schema definition and why React 19 silently ignores propTypes, requiring explicit manual verification via checkPropTypes."
          />

          <PropTypesDemoCard />
        </section>
      </main>

      {/* 6. Semantic Footer */}
      <Footer
        text="DevHub · Modular React 19 architecture built with Vite for Linkific Day 4 React Basics."
        year={new Date().getFullYear()}
      />
    </div>
  );
}

export default App;

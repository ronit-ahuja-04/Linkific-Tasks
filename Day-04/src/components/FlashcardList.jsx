import { useState } from 'react';
import FlashcardCard from './FlashcardCard';
import Button from './Button';
import Badge from './Badge';
import EmptyState from './EmptyState';
import initialFlashcards from '../data/flashcards';
import './FlashcardList.css';

/**
 * FlashcardList component (Milestone 10: Day 2 Rebuild):
 * - Rebuilds Day 2 vanilla JavaScript flashcard deck in declarative React
 * - Reconciles items using stable `key={card.id}`
 * - Interactive mastery toggles and category filters
 * - Direct comparison panel: Imperative DOM (Day 2) vs Declarative UI (Day 4)
 */
function FlashcardList() {
  const [cards, setCards] = useState(initialFlashcards);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'learning' | 'mastered'

  const handleToggleMastered = (cardId) => {
    setCards((prevCards) =>
      prevCards.map((card) =>
        card.id === cardId ? { ...card, mastered: !card.mastered } : card
      )
    );
  };

  const masteredCount = cards.filter((c) => c.mastered).length;
  const learningCount = cards.length - masteredCount;

  const displayedCards = cards.filter((card) => {
    if (filterMode === 'learning') return !card.mastered;
    if (filterMode === 'mastered') return card.mastered;
    return true;
  });

  return (
    <div className="flashcard-section-wrapper">
      {/* Metrics Bar */}
      <div className="flashcard-stats-bar">
        <div className="stats-group">
          <div className="stat-pill">
            <span className="stat-label">Total Cards:</span>
            <span className="stat-number">{cards.length}</span>
          </div>
          <div className="stat-pill">
            <span className="stat-label">Mastered:</span>
            <Badge tone="success" variant="solid">{masteredCount}</Badge>
          </div>
          <div className="stat-pill">
            <span className="stat-label">Need Practice:</span>
            <Badge tone="warning" variant="solid">{learningCount}</Badge>
          </div>
        </div>

        <div className="filter-controls">
          <Button
            variant={filterMode === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterMode('all')}
          >
            All Cards
          </Button>
          <Button
            variant={filterMode === 'learning' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterMode('learning')}
          >
            Learning ({learningCount})
          </Button>
          <Button
            variant={filterMode === 'mastered' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterMode('mastered')}
          >
            Mastered ({masteredCount})
          </Button>
        </div>
      </div>

      {/* Cards Grid or EmptyState */}
      {displayedCards.length === 0 ? (
        <EmptyState
          icon="🎓"
          title="No Flashcards in this View"
          message={`You have no cards marked as "${filterMode}". Change your filter to view other cards.`}
          action={
            <Button variant="primary" size="sm" onClick={() => setFilterMode('all')}>
              Show All Flashcards
            </Button>
          }
        />
      ) : (
        <div className="flashcard-grid">
          {displayedCards.map((card) => (
            <FlashcardCard
              key={card.id}
              card={card}
              onToggleMastered={handleToggleMastered}
            />
          ))}
        </div>
      )}

      {/* Imperative vs Declarative Comparison Panel */}
      <div className="paradigm-comparison-box">
        <div className="comparison-header">
          <span className="comparison-badge">Day 2 vs Day 4 Architecture</span>
          <h4 className="comparison-title">Imperative Vanilla JS vs Declarative React 19</h4>
        </div>

        <div className="comparison-grid">
          <div className="paradigm-card imperative-card">
            <div className="paradigm-badge-row">
              <span className="paradigm-tag tag-imperative">Day 2: Imperative DOM</span>
            </div>
            <h5>Manual DOM Manipulation</h5>
            <p>
              In Day 2, adding or updating flashcards required telling the browser <em>how</em> to construct and mutate each node:
            </p>
            <pre className="code-snippet">
{`// 1. Manually create DOM node
const card = document.createElement('div');
card.className = 'flashcard';

// 2. Attach manual event listeners
card.addEventListener('click', () => {
  card.classList.toggle('flipped');
});

// 3. Manually append to parent container
container.appendChild(card);`}
            </pre>
            <ul className="paradigm-points">
              <li>Requires manual querySelector references</li>
              <li>State can desynchronize from DOM</li>
              <li>Prone to memory leaks without event cleanup</li>
            </ul>
          </div>

          <div className="paradigm-card declarative-card">
            <div className="paradigm-badge-row">
              <span className="paradigm-tag tag-declarative">Day 4: Declarative React</span>
            </div>
            <h5>UI as a Pure Function of State</h5>
            <p>
              In Day 4, we simply declare <em>what</em> the UI looks like for any state. React Fiber computes minimal DOM mutations:
            </p>
            <pre className="code-snippet">
{`// 1. State drives the view
const [isFlipped, setIsFlipped] = useState(false);

// 2. Return JSX describing target markup
return (
  <div onClick={() => setIsFlipped(f => !f)}>
    {isFlipped ? card.back : card.front}
  </div>
);`}
            </pre>
            <ul className="paradigm-points">
              <li>Virtual DOM handles diffing &amp; updates</li>
              <li>Single source of truth in React state</li>
              <li>Stable key reconciliation guarantees order</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FlashcardList;

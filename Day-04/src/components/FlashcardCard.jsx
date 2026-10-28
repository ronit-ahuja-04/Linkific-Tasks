import { useState } from 'react';
import Card from './Card';
import Button from './Button';
import Badge from './Badge';
import './FlashcardCard.css';

/**
 * FlashcardCard component demonstrating:
 * - Day 2 rebuild: declarative flip state & mastery toggle
 * - Composition: using `Card`, `Badge`, and `Button`
 * - Local interactive state vs parent callback state updates
 */
function FlashcardCard({ card, onToggleMastered }) {
  const [isFlipped, setIsFlipped] = useState(false);

  if (!card) return null;
  const { id, front, back, category = 'General', mastered = false } = card;

  return (
    <Card className={`flashcard-card ${mastered ? 'is-mastered' : ''}`} elevation="sm">
      <div className="flashcard-top-bar">
        <Badge tone={mastered ? 'success' : 'neutral'} dot>
          {mastered ? 'Mastered' : 'Learning'}
        </Badge>
        <span className="flashcard-category">{category}</span>
      </div>

      <div
        className="flashcard-flip-container"
        onClick={() => setIsFlipped((prev) => !prev)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsFlipped((prev) => !prev);
          }
        }}
        title="Click to flip card"
      >
        <div className="flashcard-side-label">
          {isFlipped ? 'Answer (Click to flip back)' : 'Question (Click to reveal answer)'}
        </div>
        <p className="flashcard-text">
          {isFlipped ? back : front}
        </p>
      </div>

      <div className="flashcard-bottom-actions">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsFlipped((prev) => !prev)}
        >
          {isFlipped ? '🔄 Flip to Front' : '💡 Reveal Answer'}
        </Button>

        <Button
          variant={mastered ? 'secondary' : 'primary'}
          size="sm"
          onClick={() => onToggleMastered && onToggleMastered(id)}
        >
          {mastered ? 'Mark for Review' : 'Mark as Mastered'}
        </Button>
      </div>
    </Card>
  );
}

export default FlashcardCard;

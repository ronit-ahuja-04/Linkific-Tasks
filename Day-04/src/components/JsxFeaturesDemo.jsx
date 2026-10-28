import { useState } from 'react';
import Card from './Card';
import Button from './Button';
import './JsxFeaturesDemo.css';

/**
 * JsxFeaturesDemo component thoroughly covering all core JSX syntax rules:
 * 1. `className` instead of `class`
 * 2. `htmlFor` instead of `for`
 * 3. `{}` JavaScript expressions (math, variables, functions, ternary, style objects)
 * 4. React Fragments (<> ... </>) to return siblings without wrapper DOM nodes
 * 5. JSX Comments: {/* comment syntax *\/}
 * 6. Mandatory Self-Closing tags: <input />, <hr />, <img />, <br />
 * 7. Capitalized component naming convention
 * 8. JSX Gotcha: `{count && <Component />}` rendering literal `0` when count is 0
 */
function JsxFeaturesDemo() {
  const [userName, setUserName] = useState('Ronit');
  const [count, setCount] = useState(0);
  const [showExplanation, setShowExplanation] = useState(true);

  // Expression variables for demonstration
  const frameworkName = 'React 19';
  const releaseYear = 2026;
  const currentYear = new Date().getFullYear();
  const formatGreeting = (name) => `Hello, ${name || 'developer'}!`;

  // Dynamic inline style object expression demonstration
  const highlightStyle = {
    color: '#38bdf8',
    fontWeight: 700,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    padding: '0.1rem 0.35rem',
    borderRadius: '4px',
  };

  return (
    <Card className="jsx-demo-card" elevation="md">
      <div className="jsx-demo-intro">
        <h3 className="jsx-demo-heading">JSX Fundamentals &amp; Syntax Rules</h3>
        <p className="jsx-demo-description">
          JSX is a syntax extension for JavaScript that compiles to React elements.
          Below is an interactive proof of every foundational JSX syntax rule and common gotcha.
        </p>
      </div>

      <div className="jsx-rules-grid">
        {/* Rule 1: className instead of class */}
        <section className="jsx-rule-item">
          <div className="jsx-rule-header">
            <span className="jsx-rule-tag">Rule 1</span>
            <h4><code>className</code> vs HTML <code>class</code></h4>
          </div>
          <p className="jsx-rule-text">
            Because <code>class</code> is a reserved keyword in JavaScript, React components use{' '}
            <code>className</code> to assign CSS classes to DOM elements.
          </p>
          <div className="jsx-rule-demo">
            {/* JSX Comment: className is applied to the element below */}
            <div className="demo-box demo-box-active">
              Applied: <code>className=&quot;demo-box demo-box-active&quot;</code>
            </div>
          </div>
        </section>

        {/* Rule 2: htmlFor instead of for */}
        <section className="jsx-rule-item">
          <div className="jsx-rule-header">
            <span className="jsx-rule-tag">Rule 2</span>
            <h4><code>htmlFor</code> for Label Attributes</h4>
          </div>
          <p className="jsx-rule-text">
            Similarly, <code>for</code> is a reserved keyword (looping). In JSX, use{' '}
            <code>htmlFor</code> to link a label to its corresponding input <code>id</code>.
          </p>
          <div className="jsx-rule-demo">
            <label htmlFor="jsx-demo-user-input" className="demo-input-label">
              Enter your name (click label to focus input):
            </label>
            {/* Rule 6: Self-closing tag <input /> */}
            <input
              id="jsx-demo-user-input"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="demo-text-input"
              placeholder="e.g. Ronit Ahuja"
            />
          </div>
        </section>

        {/* Rule 3: {} JavaScript Expressions */}
        <section className="jsx-rule-item">
          <div className="jsx-rule-header">
            <span className="jsx-rule-tag">Rule 3</span>
            <h4><code>{'{ }'}</code> Embedded JS Expressions</h4>
          </div>
          <p className="jsx-rule-text">
            Inside JSX, anything inside curly braces is evaluated as a pure JavaScript expression:
            variables, arithmetic, function calls, and style objects.
          </p>
          <div className="jsx-rule-demo">
            <ul className="demo-list">
              <li>
                <strong>Arithmetic:</strong> 25 &times; 4 + 2 = {25 * 4 + 2}
              </li>
              <li>
                <strong>Function Call:</strong> {formatGreeting(userName)}
              </li>
              <li>
                <strong>Variable &amp; Math:</strong> {frameworkName} ({releaseYear} -{' '}
                {releaseYear - currentYear === 0 ? 'Current Version' : 'Upcoming'})
              </li>
              <li>
                <strong>Style Object:</strong>{' '}
                <span style={highlightStyle}>Evaluated from style={`{highlightStyle}`}</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Rule 4: Fragments (<> ... </>) */}
        <section className="jsx-rule-item">
          <div className="jsx-rule-header">
            <span className="jsx-rule-tag">Rule 4</span>
            <h4>React Fragments (<code>&lt;&gt; ... &lt;/&gt;</code>)</h4>
          </div>
          <p className="jsx-rule-text">
            JSX requires components to return a single root element. React Fragments let you group
            children without adding extra DOM nodes.
          </p>
          <div className="jsx-rule-demo">
            {/* Fragment grouping 2 siblings with no wrapper DOM element */}
            <>
              <div className="demo-fragment-item">Fragment Sibling Alpha</div>
              <div className="demo-fragment-item">Fragment Sibling Beta</div>
            </>
          </div>
        </section>

        {/* Rule 5: Self-Closing Tags */}
        <section className="jsx-rule-item">
          <div className="jsx-rule-header">
            <span className="jsx-rule-tag">Rule 5</span>
            <h4>Strict Self-Closing Tags</h4>
          </div>
          <p className="jsx-rule-text">
            In JSX, void tags that have no children must explicitly self-close with{' '}
            <code>/&gt;</code> (e.g., <code>&lt;img /&gt;</code>, <code>&lt;input /&gt;</code>,{' '}
            <code>&lt;hr /&gt;</code>).
          </p>
          <div className="jsx-rule-demo">
            <p>Upper section before horizontal rule</p>
            {/* Self-closing <hr /> */}
            <hr className="demo-divider" />
            <p>Lower section after self-closed <code>&lt;hr /&gt;</code></p>
          </div>
        </section>

        {/* Rule 6: JSX Gotcha - The `count && <Element />` zero trap */}
        <section className="jsx-rule-item jsx-gotcha-item">
          <div className="jsx-rule-header">
            <span className="jsx-rule-tag tag-warning">Critical Gotcha</span>
            <h4>Conditional Rendering with <code>0</code></h4>
          </div>
          <p className="jsx-rule-text">
            In JavaScript, <code>0 &amp;&amp; &lt;div&gt;</code> evaluates to <strong>0</strong>,
            not false! If count is <code>0</code>, React prints a literal <code>0</code> on screen.
            Always use <code>count &gt; 0 &amp;&amp; ...</code> or <code>Boolean(count) &amp;&amp; ...</code>.
          </p>
          <div className="jsx-rule-demo">
            <div className="demo-counter-controls">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCount((c) => Math.max(0, c - 1))}
              >
                &minus; Decrement
              </Button>
              <span className="demo-counter-value">Count: {count}</span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setCount((c) => c + 1)}
              >
                + Increment
              </Button>
            </div>

            <div className="demo-comparison-box">
              <div className="comparison-col comparison-bad">
                <span className="comparison-label">❌ Buggy Pattern: <code>{'{count && <Badge />}'}</code></span>
                <div className="comparison-result">
                  {/* BUG DEMO: If count === 0, renders raw 0 */}
                  {count && <span className="demo-alert-badge">Unread notifications!</span>}
                </div>
              </div>

              <div className="comparison-col comparison-good">
                <span className="comparison-label">✅ Safe Pattern: <code>{'{count > 0 && <Badge />}'}</code></span>
                <div className="comparison-result">
                  {/* SAFE DEMO: When count === 0, renders nothing */}
                  {count > 0 && <span className="demo-alert-badge">Unread notifications!</span>}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="jsx-demo-footer">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowExplanation((prev) => !prev)}
        >
          {showExplanation ? 'Hide JSX Summary' : 'Show JSX Summary'}
        </Button>
        {showExplanation && (
          <p className="jsx-summary-text">
            💡 JSX is transformed by Vite into <code>React.createElement</code> or the modern JSX
            runtime calls. React components must be capitalized (e.g.{' '}
            <code>&lt;JsxFeaturesDemo /&gt;</code>) so JSX differentiates custom components from
            native HTML tags.
          </p>
        )}
      </div>
    </Card>
  );
}

export default JsxFeaturesDemo;

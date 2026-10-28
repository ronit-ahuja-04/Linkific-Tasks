import { useState } from 'react';
import Card from './Card';
import Button from './Button';
import Badge from './Badge';
import './JsxFeaturesDemo.css';

/**
 * JsxFeaturesDemo
 * Interactive React compilation playground illustrating core JSX syntax principles
 * and real-time element evaluation.
 */
function JsxFeaturesDemo() {
  const [userName, setUserName] = useState('Ronit');
  const [count, setCount] = useState(0);
  const [showExplanation, setShowExplanation] = useState(true);

  const frameworkName = 'React 19';
  const releaseYear = 2026;
  const currentYear = new Date().getFullYear();
  const formatGreeting = (name) => `Welcome back, ${name || 'Engineer'}!`;

  const highlightStyle = {
    color: '#38bdf8',
    fontWeight: 700,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    border: '1px solid rgba(56, 189, 248, 0.25)',
    padding: '0.15rem 0.45rem',
    borderRadius: '4px',
  };

  return (
    <Card className="jsx-demo-card" elevation="md">
      <div className="jsx-demo-intro">
        <Badge tone="primary" variant="subtle" dot>
          Interactive Runtime
        </Badge>
        <h3 className="jsx-demo-heading">React 19 JSX Compilation Studio</h3>
        <p className="jsx-demo-description">
          Experience how JSX transpiles into reactive virtual DOM elements.
          Explore live attribute mapping, expression evaluation, fragment grouping, and evaluation edge cases.
        </p>
      </div>

      <div className="jsx-rules-grid">
        {/* Module 1: className */}
        <section className="jsx-rule-item">
          <div className="jsx-rule-header">
            <span className="jsx-rule-tag">DOM Property</span>
            <h4><code>className</code> Property Binding</h4>
          </div>
          <p className="jsx-rule-text">
            Because <code>class</code> is an ECMA keyword, JSX binds directly to the DOM property{' '}
            <code>className</code> for zero-overhead class assignment.
          </p>
          <div className="jsx-rule-demo">
            <div className="demo-box demo-box-active">
              Active Element: <code>className=&quot;demo-box demo-box-active&quot;</code>
            </div>
          </div>
        </section>

        {/* Module 2: htmlFor */}
        <section className="jsx-rule-item">
          <div className="jsx-rule-header">
            <span className="jsx-rule-tag">Accessibility</span>
            <h4><code>htmlFor</code> Input Association</h4>
          </div>
          <p className="jsx-rule-text">
            Using <code>htmlFor</code> maps directly to the browser DOM <code>htmlFor</code> property,
            ensuring full WCAG form accessibility.
          </p>
          <div className="jsx-rule-demo">
            <label htmlFor="jsx-demo-user-input" className="demo-input-label">
              Developer Name (Click label to focus):
            </label>
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

        {/* Module 3: {} Expressions */}
        <section className="jsx-rule-item">
          <div className="jsx-rule-header">
            <span className="jsx-rule-tag">Reactivity</span>
            <h4><code>{'{ }'}</code> Embedded Expressions</h4>
          </div>
          <p className="jsx-rule-text">
            Any valid JavaScript expression evaluates inside JSX: arithmetic calculations, pure function
            returns, dynamic variables, and style descriptors.
          </p>
          <div className="jsx-rule-demo">
            <ul className="demo-list">
              <li>
                <strong>Arithmetic:</strong> 25 &times; 4 + 2 = {25 * 4 + 2}
              </li>
              <li>
                <strong>Dynamic Function:</strong> {formatGreeting(userName)}
              </li>
              <li>
                <strong>Runtime State:</strong> {frameworkName} ({releaseYear} -{' '}
                {releaseYear - currentYear === 0 ? 'Current' : 'LTS'})
              </li>
              <li>
                <strong>Style Object:</strong>{' '}
                <span style={highlightStyle}>style={`{highlightStyle}`}</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Module 4: Fragments */}
        <section className="jsx-rule-item">
          <div className="jsx-rule-header">
            <span className="jsx-rule-tag">DOM Optimization</span>
            <h4>Zero-DOM Fragments (<code>&lt;&gt; ... &lt;/&gt;</code>)</h4>
          </div>
          <p className="jsx-rule-text">
            Fragments bundle multiple adjacent elements without injecting unwanted layout wrapper
            <code>&lt;div&gt;</code> tags into the DOM tree.
          </p>
          <div className="jsx-rule-demo">
            <>
              <div className="demo-fragment-item">Fragment Node Alpha</div>
              <div className="demo-fragment-item">Fragment Node Beta</div>
            </>
          </div>
        </section>

        {/* Module 5: Self-Closing Tags */}
        <section className="jsx-rule-item">
          <div className="jsx-rule-header">
            <span className="jsx-rule-tag">XML Strictness</span>
            <h4>Mandatory Self-Closing Tags</h4>
          </div>
          <p className="jsx-rule-text">
            Void HTML elements must strictly self-close with <code>/&gt;</code> for reliable AST parsing
            by the React compiler.
          </p>
          <div className="jsx-rule-demo">
            <p className="demo-note">Top segment before divider</p>
            <hr className="demo-divider" />
            <p className="demo-note">Bottom segment after self-closing <code>&lt;hr /&gt;</code></p>
          </div>
        </section>

        {/* Module 6: Falsy Gotcha */}
        <section className="jsx-rule-item jsx-gotcha-item">
          <div className="jsx-rule-header">
            <Badge tone="warning" variant="solid">Evaluation Trap</Badge>
            <h4>Conditional Zero Evaluation (<code>count && &lt;Badge /&gt;</code>)</h4>
          </div>
          <p className="jsx-rule-text">
            In JavaScript, <code>0 &amp;&amp; &lt;UI /&gt;</code> short-circuits to the number <strong>0</strong>,
            causing React to render a raw <code>0</code> on screen. Always enforce boolean comparisons:
            <code>count &gt; 0 &amp;&amp; ...</code>.
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
              <div className="demo-counter-badge">
                <span className="counter-label">Active Count:</span>
                <span className="counter-value">{count}</span>
              </div>
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
                <span className="comparison-label">❌ Buggy Syntax: <code>{'{count && <Badge />}'}</code></span>
                <div className="comparison-result">
                  {count && <span className="demo-alert-badge">New Alert</span>}
                </div>
              </div>

              <div className="comparison-col comparison-good">
                <span className="comparison-label">✅ Robust Syntax: <code>{'{count > 0 && <Badge />}'}</code></span>
                <div className="comparison-result">
                  {count > 0 && <span className="demo-alert-badge">New Alert</span>}
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
          {showExplanation ? 'Hide Engine Insights' : 'Show Engine Insights'}
        </Button>
        {showExplanation && (
          <p className="jsx-summary-text">
            💡 <strong>Compiler Architecture:</strong> Modern JSX is transpiled via the React 19 JSX runtime
            into optimized element descriptors. Custom components must begin with a capital letter
            to prevent conflicts with native HTML tags.
          </p>
        )}
      </div>
    </Card>
  );
}

export default JsxFeaturesDemo;

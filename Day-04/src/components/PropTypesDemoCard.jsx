import { useState } from 'react';
import PropTypes from 'prop-types';
import Card from './Card';
import Button from './Button';
import Badge from './Badge';
import './PropTypesDemoCard.css';

/**
 * PropTypesDemoCard
 * Type Safety & Schema Assertion Console demonstrating runtime validation
 * and modern React 19 prop contract enforcement.
 */
function PropTypesDemoCard({
  title = 'Production Architecture Guide',
  releaseYear = 2026,
  framework = 'React 19',
  features = ['Actions', 'Server Components', 'Asset Loading', 'Optimistic UI'],
  metadata = { isExperimental: false, author: 'Ronit Ahuja' },
}) {
  const [testScenario, setTestScenario] = useState('valid');
  const [capturedLogs, setCapturedLogs] = useState([]);

  const runManualValidation = (propsToTest) => {
    const logs = [];
    const originalConsoleError = console.error;

    console.error = (...args) => {
      logs.push(args.join(' '));
      originalConsoleError(...args);
    };

    try {
      PropTypes.checkPropTypes(
        PropTypesDemoCard.propTypes,
        propsToTest,
        'prop',
        'PropTypesDemoCard'
      );
    } finally {
      console.error = originalConsoleError;
    }

    setCapturedLogs(logs);
  };

  const handleTestValid = () => {
    setTestScenario('valid');
    runManualValidation({
      title: 'Production Architecture Guide',
      releaseYear: 2026,
      framework: 'React 19',
      features: ['Actions', 'Server Components'],
      metadata: { isExperimental: false, author: 'Ronit Ahuja' },
    });
  };

  const handleTestInvalid = () => {
    setTestScenario('invalid');
    runManualValidation({
      title: 99999, // Expected string
      releaseYear: 'Twenty-Twenty-Six', // Expected number
      framework: 'Angular', // Not in oneOf list
      features: 'Not an array', // Expected arrayOf
      metadata: 'Not an object shape', // Expected shape
    });
  };

  return (
    <Card className="proptypes-card" elevation="md">
      <div className="proptypes-header">
        <div>
          <span className="proptypes-kicker">Runtime Telemetry &bull; Schema Enforcement</span>
          <h3 className="proptypes-title">Type Safety &amp; Contract Verification</h3>
        </div>
        <Badge tone="info" variant="subtle" dot>
          Active Schema
        </Badge>
      </div>

      <p className="proptypes-explanation">
        Modern enterprise applications rely on strict prop contracts. Because React 19 optimizes bundle
        footprint by delegating dev-time validation to TypeScript, legacy runtime validation requires explicit
        contract checking via <code>PropTypes.checkPropTypes()</code>.
      </p>

      {/* Rendered prop values summary */}
      <div className="proptypes-rendered-props">
        <h4 className="props-summary-title">Active Contract Payload:</h4>
        <div className="props-summary-grid">
          <div className="prop-item">
            <span className="prop-name">title (string):</span>
            <span className="prop-val">{String(title)}</span>
          </div>
          <div className="prop-item">
            <span className="prop-name">releaseYear (number):</span>
            <span className="prop-val">{String(releaseYear)}</span>
          </div>
          <div className="prop-item">
            <span className="prop-name">framework (oneOf):</span>
            <span className="prop-val">{framework}</span>
          </div>
          <div className="prop-item">
            <span className="prop-name">features (arrayOf string):</span>
            <span className="prop-val">{Array.isArray(features) ? features.join(', ') : String(features)}</span>
          </div>
          <div className="prop-item">
            <span className="prop-name">metadata.author:</span>
            <span className="prop-val">{metadata?.author || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="proptypes-controls">
        <span className="controls-label">Run Live Contract Evaluation:</span>
        <div className="controls-buttons">
          <Button
            variant={testScenario === 'valid' ? 'primary' : 'outline'}
            size="sm"
            onClick={handleTestValid}
          >
            ✅ Pass Valid Payload
          </Button>
          <Button
            variant={testScenario === 'invalid' ? 'danger' : 'outline'}
            size="sm"
            onClick={handleTestInvalid}
          >
            ⚠️ Inject Schema Violation
          </Button>
        </div>
      </div>

      {/* Captured Validation Output */}
      <div className="proptypes-output-box">
        <div className="output-header">
          <div className="output-status-left">
            <span className="terminal-dot red" />
            <span className="terminal-dot yellow" />
            <span className="terminal-dot green" />
            <span className="output-title">
              <code>checkPropTypes()</code> Diagnostics Stream
            </span>
          </div>
          <Badge tone={capturedLogs.length === 0 ? 'success' : 'danger'}>
            {capturedLogs.length === 0 ? '0 Violations' : `${capturedLogs.length} Contract Mismatches`}
          </Badge>
        </div>

        {capturedLogs.length === 0 ? (
          <div className="output-success">
            ✨ All prop parameters strictly adhere to the defined component interface. No runtime violations.
          </div>
        ) : (
          <div className="output-warnings">
            {capturedLogs.map((log, index) => (
              <pre key={index} className="warning-line">
                {log}
              </pre>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

PropTypesDemoCard.propTypes = {
  title: PropTypes.string.isRequired,
  releaseYear: PropTypes.number.isRequired,
  framework: PropTypes.oneOf(['React 19', 'Next.js', 'Vite']),
  features: PropTypes.arrayOf(PropTypes.string),
  metadata: PropTypes.shape({
    isExperimental: PropTypes.bool,
    author: PropTypes.string,
  }),
};

export default PropTypesDemoCard;

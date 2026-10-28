import { useState } from 'react';
import PropTypes from 'prop-types';
import Card from './Card';
import Button from './Button';
import Badge from './Badge';
import './PropTypesDemoCard.css';

/**
 * Component demonstrating PropTypes definition & manual verification.
 *
 * NOTE ON REACT 19:
 * React 19 silently ignores `Component.propTypes` at runtime during rendering.
 * To demonstrate PropTypes validation and observe real warning messages,
 * this component calls `PropTypes.checkPropTypes()` manually.
 */
function PropTypesDemoCard({
  title = 'React 19 Architecture Guide',
  releaseYear = 2026,
  framework = 'React 19',
  features = ['Actions', 'Server Components', 'Asset Loading', 'Optimistic UI'],
  metadata = { isExperimental: false, author: 'Ronit Ahuja' },
}) {
  const [testScenario, setTestScenario] = useState('valid');
  const [capturedLogs, setCapturedLogs] = useState([]);

  // Runs manual PropTypes validation using PropTypes.checkPropTypes
  const runManualValidation = (propsToTest) => {
    const logs = [];
    const originalConsoleError = console.error;

    // Temporarily intercept console.error to capture PropTypes warnings
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
      title: 'React 19 Architecture Guide',
      releaseYear: 2026,
      framework: 'React 19',
      features: ['Actions', 'Server Components'],
      metadata: { isExperimental: false, author: 'Ronit Ahuja' },
    });
  };

  const handleTestInvalid = () => {
    setTestScenario('invalid');
    // Intentionally invalid props (wrong types)
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
          <span className="proptypes-kicker">React 19 &bull; Runtime Verification</span>
          <h3 className="proptypes-title">PropTypes Validation &amp; React 19 Behavior</h3>
        </div>
        <Badge tone="warning" variant="solid">
          React 19 Note
        </Badge>
      </div>

      <p className="proptypes-explanation">
        In <strong>React 19</strong>, <code>Component.propTypes</code> is{' '}
        <em>silently ignored</em> by the React reconciler in development mode.
        To verify props at runtime or understand legacy codebases, we use{' '}
        <code>PropTypes.checkPropTypes()</code> manually.
      </p>

      {/* Render current prop values */}
      <div className="proptypes-rendered-props">
        <h4 className="props-summary-title">Rendered Prop Values:</h4>
        <ul className="props-summary-list">
          <li><strong>title (string):</strong> {String(title)}</li>
          <li><strong>releaseYear (number):</strong> {String(releaseYear)}</li>
          <li><strong>framework (oneOf):</strong> {framework}</li>
          <li><strong>features (arrayOf string):</strong> {Array.isArray(features) ? features.join(', ') : String(features)}</li>
          <li><strong>metadata.author:</strong> {metadata?.author || 'N/A'}</li>
        </ul>
      </div>

      {/* Interactive Scenario Controls */}
      <div className="proptypes-controls">
        <span className="controls-label">Test Manual Verification:</span>
        <div className="controls-buttons">
          <Button
            variant={testScenario === 'valid' ? 'primary' : 'outline'}
            size="sm"
            onClick={handleTestValid}
          >
            ✅ Validate Correct Props
          </Button>
          <Button
            variant={testScenario === 'invalid' ? 'danger' : 'outline'}
            size="sm"
            onClick={handleTestInvalid}
          >
            ❌ Trigger Invalid Props Warning
          </Button>
        </div>
      </div>

      {/* Captured Validation Output */}
      <div className="proptypes-output-box">
        <div className="output-header">
          <span className="output-title">
            <code>PropTypes.checkPropTypes()</code> Result:
          </span>
          <Badge tone={capturedLogs.length === 0 ? 'success' : 'danger'}>
            {capturedLogs.length === 0 ? '0 Errors Detected' : `${capturedLogs.length} Type Warnings`}
          </Badge>
        </div>

        {capturedLogs.length === 0 ? (
          <div className="output-success">
            ✨ All props passed validation cleanly. No type warnings generated.
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

// Full PropTypes Schema definition
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

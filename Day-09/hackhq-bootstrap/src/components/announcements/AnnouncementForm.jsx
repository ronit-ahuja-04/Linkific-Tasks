import { useState } from 'react';
import { Alert, Form } from 'react-bootstrap';
import {
  BODY_MAX,
  CATEGORIES,
  FORM_ID,
  TITLE_MAX,
  validateAnnouncement,
} from '../../lib/announcements.js';

const BLANK = { title: '', body: '', category: 'General', pinned: false };

/**
 * CONCEPT: Bootstrap form validation - the pure validateAnnouncement() decides what is wrong,
 * `isInvalid` + Form.Control.Feedback decide how it looks. Errors appear once a field has been
 * left (blur) or the form has been submitted, never while the person is still typing the first time.
 * The submit button lives in the modal footer and points at this form with the `form` attribute.
 */
export default function AnnouncementForm({ post, onSubmit }) {
  const [draft, setDraft] = useState(post ? { ...BLANK, ...post } : BLANK);
  const [touched, setTouched] = useState({});
  const [attempted, setAttempted] = useState(false);

  const errors = validateAnnouncement(draft);
  const errorCount = Object.keys(errors).length;
  const showError = (field) => (attempted || touched[field]) && Boolean(errors[field]);

  const fieldProps = (field) => ({
    value: draft[field],
    isInvalid: showError(field),
    onChange: (event) => setDraft((prev) => ({ ...prev, [field]: event.target.value })),
    onBlur: () => setTouched((prev) => ({ ...prev, [field]: true })),
    'aria-describedby': showError(field) ? `${FORM_ID}-${field}-error` : undefined,
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    setAttempted(true);
    if (errorCount === 0) onSubmit(draft);
  };

  return (
    <Form id={FORM_ID} noValidate onSubmit={handleSubmit}>
      {attempted && errorCount > 0 && (
        <Alert variant="danger" className="py-2 small" role="alert">
          Fix {errorCount} {errorCount === 1 ? 'field' : 'fields'} to publish.
        </Alert>
      )}

      <Form.Group className="mb-3" controlId={`${FORM_ID}-title`}>
        <Form.Label className="fw-medium">Title</Form.Label>
        <Form.Control type="text" placeholder="Lunch is ready" {...fieldProps('title')} />
        <Form.Control.Feedback type="invalid" id={`${FORM_ID}-title-error`}>
          {errors.title}
        </Form.Control.Feedback>
        <Form.Text className="d-block text-end">
          {draft.title.trim().length} / {TITLE_MAX}
        </Form.Text>
      </Form.Group>

      <Form.Group className="mb-3" controlId={`${FORM_ID}-category`}>
        <Form.Label className="fw-medium">Category</Form.Label>
        <Form.Select {...fieldProps('category')}>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Form.Select>
        <Form.Control.Feedback type="invalid" id={`${FORM_ID}-category-error`}>
          {errors.category}
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3" controlId={`${FORM_ID}-body`}>
        <Form.Label className="fw-medium">Message</Form.Label>
        <Form.Control
          as="textarea"
          rows={5}
          placeholder="What do attendees need to know?"
          {...fieldProps('body')}
        />
        <Form.Control.Feedback type="invalid" id={`${FORM_ID}-body-error`}>
          {errors.body}
        </Form.Control.Feedback>
        <Form.Text className="d-block text-end">
          {draft.body.trim().length} / {BODY_MAX}
        </Form.Text>
      </Form.Group>

      <Form.Check
        type="switch"
        id={`${FORM_ID}-pinned`}
        label="Pin to the top"
        checked={draft.pinned}
        onChange={(event) => setDraft((prev) => ({ ...prev, pinned: event.target.checked }))}
      />
    </Form>
  );
}

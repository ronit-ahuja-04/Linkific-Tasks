import { useState } from 'react';
import styled from 'styled-components';
import {
  Alert,
  CheckRow,
  ErrorText,
  FormGroup,
  Hint,
  Input,
  Label,
  Select,
  Stack,
  Textarea,
} from '../ui.jsx';
import {
  BODY_MAX,
  CATEGORIES,
  FORM_ID,
  TITLE_MAX,
  validateAnnouncement,
} from '../../lib/announcements.js';

const BLANK = { title: '', body: '', category: 'General', pinned: false };

const Counter = styled(Hint)`
  text-align: right;
`;

const FormAlert = styled(Alert)`
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
`;

/**
 * CONCEPT: Controlled form validation - the pure validateAnnouncement() decides what is wrong,
 * `$invalid` + ErrorText decide how it looks. Errors appear once a field has been
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
    id: `${FORM_ID}-${field}`,
    value: draft[field],
    $invalid: showError(field),
    'aria-invalid': showError(field) || undefined,
    onChange: (event) => setDraft((prev) => ({ ...prev, [field]: event.target.value })),
    onBlur: () => setTouched((prev) => ({ ...prev, [field]: true })),
    'aria-describedby': showError(field) ? `${FORM_ID}-${field}-error` : undefined,
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    setAttempted(true);
    if (errorCount === 0) onSubmit(draft);
  };

  const feedback = (field) =>
    showError(field) ? (
      <ErrorText id={`${FORM_ID}-${field}-error`}>{errors[field]}</ErrorText>
    ) : null;

  return (
    <form id={FORM_ID} noValidate onSubmit={handleSubmit}>
      <Stack $gap={3}>
        {attempted && errorCount > 0 && (
          <FormAlert $tone="bad" role="alert">
            Fix {errorCount} {errorCount === 1 ? 'field' : 'fields'} to publish.
          </FormAlert>
        )}

        <FormGroup>
          <Label htmlFor={`${FORM_ID}-title`}>Title</Label>
          <Input type="text" placeholder="Lunch is ready" {...fieldProps('title')} />
          {feedback('title')}
          <Counter>
            {draft.title.trim().length} / {TITLE_MAX}
          </Counter>
        </FormGroup>

        <FormGroup>
          <Label htmlFor={`${FORM_ID}-category`}>Category</Label>
          <Select {...fieldProps('category')}>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
          {feedback('category')}
        </FormGroup>

        <FormGroup>
          <Label htmlFor={`${FORM_ID}-body`}>Message</Label>
          <Textarea
            rows={5}
            placeholder="What do attendees need to know?"
            {...fieldProps('body')}
          />
          {feedback('body')}
          <Counter>
            {draft.body.trim().length} / {BODY_MAX}
          </Counter>
        </FormGroup>

        <CheckRow htmlFor={`${FORM_ID}-pinned`}>
          <input
            type="checkbox"
            role="switch"
            id={`${FORM_ID}-pinned`}
            checked={draft.pinned}
            onChange={(event) => setDraft((prev) => ({ ...prev, pinned: event.target.checked }))}
          />
          Pin to the top
        </CheckRow>
      </Stack>
    </form>
  );
}

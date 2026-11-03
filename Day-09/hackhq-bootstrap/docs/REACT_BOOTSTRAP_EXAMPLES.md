# React Bootstrap integration examples

Seven places where HackHQ hands an event to a React Bootstrap component. Each one shows the real code, what the event carries, and why React Bootstrap is used instead of Bootstrap's own JavaScript.

**The rule behind all of them:** React owns the state, and React Bootstrap components report events up through props (`onClick`, `onSubmit`, `onSelect`, `onHide`, `onClose`, `onChange`). Bootstrap's own JavaScript (`data-bs-toggle`) changes the DOM directly, which fights React's rendering, so the app never uses it. The one place that does is [`cdn-demo.html`](../cdn-demo.html), which has no React.

## 1. `onClick` on a `ButtonGroup` (filter)

[`src/pages/Announcements.jsx:106`](../src/pages/Announcements.jsx)

```jsx
<ButtonGroup aria-label="Filter by category">
  {['all', ...CATEGORIES].map((name) => (
    <Button
      key={name}
      variant={category === name ? 'dark' : 'secondary'}
      aria-pressed={category === name}
      onClick={() => setCategory(name)}
    >
      {name === 'all' ? 'All' : name}
    </Button>
  ))}
</ButtonGroup>
```

The click handler sets one piece of state, and the list below is derived from it. The same pattern filters the schedule by track.

## 2. `onSubmit` on a `Form` with `isInvalid` feedback

[`src/components/announcements/AnnouncementForm.jsx:36`](../src/components/announcements/AnnouncementForm.jsx)

```jsx
const handleSubmit = (event) => {
  event.preventDefault();
  setAttempted(true);
  if (errorCount === 0) onSubmit(draft);
};

<Form id={FORM_ID} noValidate onSubmit={handleSubmit}>
  <Form.Control isInvalid={showError('title')} value={draft.title} onChange={...} />
  <Form.Control.Feedback type="invalid">{errors.title}</Form.Control.Feedback>
</Form>
```

A plain function (`validateAnnouncement`) decides what is wrong. `isInvalid` only decides how it looks. `noValidate` turns off the browser's own bubbles so Bootstrap's styling is the only feedback. The submit button sits in the modal footer and points at the form with `form={FORM_ID}`.

## 3. `onSelect` on `Tabs`

[`src/pages/Schedule.jsx:157`](../src/pages/Schedule.jsx)

```jsx
<Tabs id="schedule-tabs" activeKey={activeTab} onSelect={(key) => setActiveTab(key)}>
  {DAYS.map((day) => (
    <Tab key={day} eventKey={day} title={formatDayLabel(day)}>
      ...
    </Tab>
  ))}
  <Tab eventKey="mine" title="My schedule">
    ...
  </Tab>
</Tabs>
```

`onSelect` receives the `eventKey` of the tab chosen by click or arrow key. Making the tabs controlled (`activeKey`) lets the page choose the starting day. The wrapper `div` adds Home and End on top, because React Bootstrap only handles the arrow keys.

## 4. `onHide` on a `Modal` (one modal, dynamic content)

[`src/components/ContentModal.jsx:10`](../src/components/ContentModal.jsx), used from [`src/pages/Announcements.jsx:177`](../src/pages/Announcements.jsx)

```jsx
<ContentModal
  show={composing !== null}
  onHide={() => setComposing(null)}
  title={editingPost ? 'Edit announcement' : 'New announcement'}
>
  <AnnouncementForm post={editingPost} onSubmit={handleSubmit} />
</ContentModal>
```

`onHide` fires for the close button, a backdrop click and the Escape key, so one handler covers all three. What the modal shows depends on state (`composing` is `null`, `'new'`, or a post id). The same component serves the swag quick view and the directory posts.

## 5. `onHide` on an `Offcanvas` (mobile drawer)

[`src/components/Navigation.jsx:88`](../src/components/Navigation.jsx)

```jsx
<Offcanvas show={open} onHide={onClose} placement="start" className="d-lg-none">
  <Offcanvas.Body>
    <NavList onNavigate={onClose} />
  </Offcanvas.Body>
</Offcanvas>
```

The same `onClose` is also passed to each link as `onNavigate`, so choosing a station closes the drawer. The header button that opens it only calls `setNavOpen(true)`.

## 6. `onClose` on a `Toast`

[`src/components/ToastContainer.jsx:30`](../src/components/ToastContainer.jsx)

```jsx
<Toast show onClose={() => onDismiss(toast.id)} role="status">
  <Toast.Header closeButton closeLabel="Dismiss notification">
    ...
  </Toast.Header>
</Toast>
```

The app keeps the toast list in state and removes entries itself, so `show` is always true and `onClose` just removes the entry. `autohide` is not used because `App.jsx` already auto-dismisses with a timer.

## 7. `onChange` on an `InputGroup` search box

[`src/pages/Announcements.jsx:121`](../src/pages/Announcements.jsx)

```jsx
<InputGroup>
  <InputGroup.Text>
    <Search size={16} />
  </InputGroup.Text>
  <Form.Control
    type="search"
    value={query}
    onChange={(event) => setQuery(event.target.value)}
    aria-label="Search announcements"
  />
</InputGroup>
```

A controlled input: React holds the value, and `filterAnnouncements(list, { query })` runs on every render.

## Plain classes and React Bootstrap side by side

| Need              | Plain Bootstrap (CDN demo)                    | React Bootstrap (the app)                         |
| ----------------- | --------------------------------------------- | ------------------------------------------------- |
| Open a modal      | `data-bs-toggle="modal" data-bs-target="#id"` | `show` state plus `onHide`                        |
| Collapse a navbar | `data-bs-toggle="collapse"`                   | `Navbar` with `expand`, or `Offcanvas` with state |
| Accordion         | `data-bs-parent` attributes                   | `<Accordion>` and `<Accordion.Item eventKey>`     |
| Dark mode         | `data-bs-theme` on `<html>`                   | the same attribute, set from React state          |

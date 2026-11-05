// Toast buttons (e.g. "Undo") carry a function, and functions must not live in the Redux store.
// The store keeps only the serializable toast; the click handler is parked here, keyed by toast id.
const handlers = new Map();

export const registerToastAction = (id, onClick) => handlers.set(id, onClick);
export const takeToastAction = (id) => {
  const fn = handlers.get(id);
  handlers.delete(id);
  return fn;
};
export const dropToastAction = (id) => handlers.delete(id);

import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Redo2, Undo2 } from 'lucide-react';
import styled from 'styled-components';
import { Button } from './ui.jsx';
import { redo, selectCanRedo, selectCanUndo, undo } from '../store/undoable.js';

const Group = styled.div`
  display: inline-flex;
  gap: 0.25rem;
`;

/** Undo / redo for one tracked slice ("tasks" or "cart") */
export default function UndoRedoButtons({ slice, label }) {
  // REDUX: the history lives in the store (state.history), so these buttons are just selectors
  // and two actions. The slice's own reducers know nothing about undo.
  const canUndo = useSelector(useMemo(() => selectCanUndo(slice), [slice]));
  const canRedo = useSelector(useMemo(() => selectCanRedo(slice), [slice]));
  const dispatch = useDispatch();

  return (
    <Group role="group" aria-label={`Undo and redo ${label}`}>
      <Button
        $variant="secondary"
        $size="sm"
        onClick={() => dispatch(undo(slice))}
        disabled={!canUndo}
        title={`Undo last ${label} change`}
      >
        <Undo2 size={15} aria-hidden="true" />
        <span>Undo</span>
      </Button>
      <Button
        $variant="secondary"
        $size="sm"
        onClick={() => dispatch(redo(slice))}
        disabled={!canRedo}
        title={`Redo ${label} change`}
      >
        <Redo2 size={15} aria-hidden="true" />
        <span>Redo</span>
      </Button>
    </Group>
  );
}

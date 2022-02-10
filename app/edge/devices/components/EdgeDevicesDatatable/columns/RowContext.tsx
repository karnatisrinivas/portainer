import { createRowContext } from '@/portainer/components/datatables/RowContext';

interface RowContextState {
  isOpenAmtEnabled: boolean;
  groupName?: string;
}

const { RowProvider, useRowContext } = createRowContext<RowContextState>();

export { RowProvider, useRowContext };

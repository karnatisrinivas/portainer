import { CellProps, Column } from 'react-table';
import clsx from 'clsx';

import { DefaultFilter } from '@/portainer/components/datatables/components/Filter';
import { DockerContainer, ContainerStatus } from '@/docker/containers/types';

export const state: Column<DockerContainer> = {
  Header: 'State',
  accessor: 'Status',
  id: 'state',
  Cell: StatusCell,
  sortType: 'string',
  filter: 'multiple',
  Filter: DefaultFilter,
  canHide: true,
};

function StatusCell({
  value: status,
}: CellProps<DockerContainer, ContainerStatus>) {
  const hasHealthCheck = [
    ContainerStatus.Starting,
    ContainerStatus.Healthy,
    ContainerStatus.Unhealthy,
  ].includes(status);

  const statusClassName = getClassName();

  return (
    <span
      className={clsx('label', `label-${statusClassName}`, {
        interactive: hasHealthCheck,
      })}
      title={hasHealthCheck ? 'This container has a health check' : ''}
    >
      {status}
    </span>
  );

  function getClassName() {
    switch (status) {
      case ContainerStatus.Paused:
      case ContainerStatus.Starting:
      case ContainerStatus.Unhealthy:
        return 'warning';
      case ContainerStatus.Created:
        return 'info';
      case ContainerStatus.Stopped:
      case ContainerStatus.Dead:
      case ContainerStatus.Exited:
        return 'danger';
      case ContainerStatus.Healthy:
      case ContainerStatus.Running:
      default:
        return 'success';
    }
  }
}

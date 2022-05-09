import { useState } from 'react';
import { DialogOverlay } from '@reach/dialog';

import * as kcService from '@/kubernetes/services/kubeconfig.service';
import * as notifications from '@/portainer/services/notifications';
import { Environment } from '@/portainer/environments/types';
import { EnvironmentsQueryParams } from '@/portainer/environments/environment.service/index';
import { isKubernetesEnvironment } from '@/portainer/environments/utils';
import { trackEvent } from '@/angulartics.matomo/analytics-services';
import { Button } from '@/portainer/components/Button';
import { PaginationControls } from '@/portainer/components/pagination-controls';
import { useEnvironmentList } from '@/portainer/environments/queries';
import { usePaginationLimitState } from '@/portainer/hooks/usePaginationLimitState';
import '@reach/dialog/styles.css';
import './KubeconfigButton.css';

const selection = new Set<number>();
export interface KubeconfigButtonProps {
  environments: Environment[];
  envQueryParams: EnvironmentsQueryParams;
}
export function KubeconfigButton({
  environments,
  envQueryParams,
}: KubeconfigButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [ksExpiry, setKsExpiry] = useState('');
  if (!environments) {
    return null;
  }

  if (!isKubeconfigButtonVisible(environments)) {
    return null;
  }

  return (
    <div>
      <Button onClick={handleClick}>
        <i className="fas fa-download space-right" /> kubeconfig
      </Button>
      <DialogOverlay
        className="center-dialog"
        isOpen={showDialog}
        aria-label="Kubeconfig View"
        role="dialog"
      >
        <div className="modal-content">
          <div className="modal-header">
            <button
              type="button"
              className="bootbox-close-button close"
              aria-hidden="true"
              onClick={handleClose}
            >
              ×
            </button>
            <h5 className="modal-title">Download kubeconfig file</h5>
          </div>
          <KubeconfigPormpt
            ksExpiry={ksExpiry}
            selection={selection}
            envQueryParams={envQueryParams}
          />
          <div className="modal-footer">
            <Button onClick={handleClose} color="default">
              Cancel
            </Button>
            <Button onClick={handleDownload}>Download File</Button>
          </div>
        </div>
      </DialogOverlay>
    </div>
  );

  function handleClick() {
    if (!environments) {
      return;
    }

    trackEvent('kubernetes-kubectl-kubeconfig-multi', {
      category: 'kubernetes',
    });

    fetchKsExpiry();
    selection.clear();
    setShowDialog(true);
  }

  function handleClose() {
    setShowDialog(false);
  }

  function handleDownload() {
    confirmKubeconfigSelection();
  }

  function isKubeconfigButtonVisible(environments: Environment[]) {
    if (window.location.protocol !== 'https:') {
      return false;
    }
    return environments.some((env) => isKubernetesEnvironment(env.Type));
  }

  async function fetchKsExpiry() {
    let expiryMessage = '';
    try {
      expiryMessage = await kcService.expiryMessage();
    } catch (e) {
      notifications.error('Failed fetching kubeconfig expiry time', e as Error);
    }
    setKsExpiry(expiryMessage);
  }

  async function confirmKubeconfigSelection() {
    if (selection.size === 0) {
      notifications.warning('No environment was selected', '');
      return;
    }
    try {
      await kcService.downloadKubeconfigFile(Array.from(selection));
      setShowDialog(false);
    } catch (e) {
      notifications.error('Failed downloading kubeconfig file', e as Error);
    }
  }
}

export interface KubeconfigPormptProps {
  ksExpiry: string;
  selection: Set<number>;
  envQueryParams: EnvironmentsQueryParams;
}
const storageKey = 'home_endpoints';

export function KubeconfigPormpt({
  ksExpiry,
  selection,
  envQueryParams,
}: KubeconfigPormptProps) {
  const [page, setPage] = useState(1);
  const [pageLimit, setPageLimit] = usePaginationLimitState(storageKey);
  const [checked, setChecked] = useState(false);
  const [checkAll, setCheckAll] = useState(false);
  const { environments, totalCount } = useEnvironmentList(
    { page, pageLimit, ...envQueryParams },
    true
  );
  const kubeEnvs = environments.filter((env) =>
    isKubernetesEnvironment(env.Type)
  );
  const selected = Array<boolean>();
  for (let i = 0, len = kubeEnvs.length; i < len; i += 1) {
    selected.push(selection.has(kubeEnvs[i].Id));
  }

  return (
    <div className="modal-body">
      <form className="bootbox-form">
        <div className="bootbox-prompt-message">
          <p>
            Select the kubernetes environment(s) to add to the kubeconfig file.{' '}
            <br />
            {ksExpiry}
          </p>
        </div>
        <div className="form-check">
          <label>
            <input
              type="checkbox"
              checked={isCheckAll()}
              onChange={() => onCheckAll()}
            />{' '}
            Select all (in this page)
          </label>
        </div>
      </form>
      <div className="datatable">
        <div className="bootbox-checkbox-list">
          {kubeEnvs.map((env, index) => (
            <div className="form-check" key={env.Id}>
              <label>
                <input
                  type="checkbox"
                  checked={selected[index]}
                  onChange={() => onCheck(env.Id)}
                />{' '}
                {env.Name} ({env.URL})
              </label>
            </div>
          ))}
        </div>
        <div className="footer" style={{ backgroundColor: 'white' }}>
          <PaginationControls
            showAll={totalCount <= 100}
            page={page}
            onPageChange={setPage}
            pageLimit={pageLimit}
            onPageLimitChange={setPageLimit}
            totalCount={totalCount}
          />
        </div>
      </div>
    </div>
  );

  function onCheck(envId: number) {
    if (selection.has(envId)) {
      selection.delete(envId);
    } else {
      selection.add(envId);
    }
    setChecked(!checked);
  }

  function isCheckAll() {
    for (let i = 0; i < kubeEnvs.length; i += 1) {
      if (!selection.has(kubeEnvs[i].Id)) {
        return false;
      }
    }
    return true;
  }

  function onCheckAll() {
    if (isCheckAll()) {
      for (let i = 0; i < kubeEnvs.length; i += 1) {
        selection.delete(kubeEnvs[i].Id);
      }
    } else {
      for (let i = 0; i < kubeEnvs.length; i += 1) {
        selection.add(kubeEnvs[i].Id);
      }
    }
    setCheckAll(!checkAll);
  }
}

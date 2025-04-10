import { Alert, Button, LinearProgress, Snackbar, Stack, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { IpcChannel } from '../../nest/common/ipc.channel';
interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes?: string;
}

interface ProgressInfo {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
}

export function UpdateNotification() {
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<ProgressInfo | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string>('');

  useEffect(() => {
    // 현재 버전 가져오기
    window.electron.ipcRenderer
      .invoke(IpcChannel.GetCurrentVersion)
      .then((version) => setCurrentVersion(version))
      .catch(console.error);

    // 업데이트 이벤트 리스너 등록
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unsubscribe = window.electron.ipcRenderer.on('update-status', (data: any) => {
      const { status, data: updateData } = data;

      setUpdateStatus(status);

      if (status === '업데이트_가능') {
        setUpdateInfo(updateData);
      } else if (status === '다운로드_진행') {
        setDownloadProgress(updateData);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const checkForUpdates = () => {
    setUpdateStatus('업데이트 확인 중...');
    window.electron.ipcRenderer.invoke(IpcChannel.CheckForUpdates).catch((err) => {
      setUpdateStatus('업데이트_오류');
      console.error('업데이트 확인 오류:', err);
    });
  };

  const downloadUpdate = () => {
    setUpdateStatus('다운로드 시작...');
    window.electron.ipcRenderer.invoke(IpcChannel.DownloadUpdate).catch((err) => {
      setUpdateStatus('업데이트_오류');
      console.error('업데이트 다운로드 오류:', err);
    });
  };

  const installUpdate = () => {
    window.electron.ipcRenderer.invoke(IpcChannel.QuitAndInstall).catch(console.error);
  };

  const renderUpdateContent = () => {
    switch (updateStatus) {
      case '업데이트 확인 중...':
      case '다운로드 시작...':
        return <Alert severity="info">업데이트 확인 중...</Alert>;

      case '업데이트_가능':
        return (
          <Alert
            severity="info"
            action={
              <Button color="primary" size="small" onClick={downloadUpdate}>
                다운로드
              </Button>
            }
          >
            새 버전 {updateInfo?.version} 사용 가능 (현재 {currentVersion})
            {updateInfo?.releaseNotes && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                {updateInfo.releaseNotes}
              </Typography>
            )}
          </Alert>
        );

      case '다운로드_진행':
        return (
          <Alert severity="info">
            업데이트 다운로드 중... {downloadProgress ? Math.round(downloadProgress.percent) : 0}%
            <LinearProgress
              variant="determinate"
              value={downloadProgress?.percent || 0}
              sx={{ mt: 1 }}
            />
          </Alert>
        );

      case '업데이트_다운로드_완료':
        return (
          <Alert
            severity="success"
            action={
              <Button color="primary" size="small" onClick={installUpdate}>
                설치 및 재시작
              </Button>
            }
          >
            업데이트 준비 완료
          </Alert>
        );

      case '업데이트_없음':
        return <Alert severity="success">최신 버전을 사용 중입니다 (v{currentVersion})</Alert>;

      case '업데이트_오류':
        return <Alert severity="error">업데이트 중 오류가 발생했습니다</Alert>;

      default:
        return <Alert severity="info">업데이트 상태 확인 중...</Alert>;
    }
  };

  const isSnackbarOpen =
    !!updateStatus &&
    ['업데이트_가능', '업데이트_다운로드_완료', '업데이트_오류'].includes(updateStatus);

  return (
    <Stack spacing={2}>
      <Button variant="outlined" onClick={checkForUpdates} sx={{ alignSelf: 'flex-start' }}>
        업데이트 확인
      </Button>

      {isSnackbarOpen && (
        <Snackbar
          open={true}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          autoHideDuration={updateStatus === '업데이트_오류' ? 6000 : null}
        >
          {renderUpdateContent()}
        </Snackbar>
      )}

      {updateStatus && !isSnackbarOpen && <div>{renderUpdateContent()}</div>}
    </Stack>
  );
}

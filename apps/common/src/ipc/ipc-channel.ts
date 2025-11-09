export enum IpcChannel {
  // 통합 채널 - 파일과 문자열을 함께 처리
  OpenExternalUrl = 'open-external-url',

  // Advanced Image Viewer
  OpenAdvancedImageViewer = 'open-advanced-image-viewer',
  AdvancedViewerLoadZip = 'advanced-viewer-load-zip',
  // Choose a ZIP via OS dialog and open in viewer (path-only)
  OpenZipInAdvancedViewerDialog = 'open-zip-in-advanced-viewer-dialog',
}

import dotenv from 'dotenv';
import path from 'path';

// 백엔드 디렉토리의 .env 파일을 명시적으로 로드
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

import { app } from 'electron';

// 앱이 패키지된 상태인지 확인하고 NODE_ENV 설정
const isPackaged = app?.isPackaged ?? false;
if (isPackaged) process.env.NODE_ENV = 'production';

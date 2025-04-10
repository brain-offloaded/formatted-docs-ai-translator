import dotenv from 'dotenv';
dotenv.config();
import { app } from 'electron';

// 앱이 패키지된 상태인지 확인하고 NODE_ENV 설정
const isPackaged = app.isPackaged;
if (isPackaged) process.env.NODE_ENV = 'production';

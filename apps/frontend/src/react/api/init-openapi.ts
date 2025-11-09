// src/react/api/init-openapi.ts
import { OpenAPI } from '../api/generated';
import { HTTP_BASE_URL } from '@/react/constants/http';

// 주의: 생성물 수정 없이 런타임에 BASE만 주입
OpenAPI.BASE = HTTP_BASE_URL;

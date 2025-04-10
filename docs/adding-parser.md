# 새 파서 추가 가이드

이 문서는 프로젝트에 새로운 파서를 추가하는 방법에 대해 설명합니다.

## 목차

- [IPC 채널 추가](#ipc-채널-추가)
- [DTO 파일 만들기](#dto-파일-만들기)
- [Invoke에 등록하기](#invoke에-등록하기)
- [파서 구현체 작성](#파서-구현체-작성)

## IPC 채널 추가

1. `src/nest/common/ipc.channel.ts` 파일에 새 IPC 채널을 추가합니다.

```typescript
export enum IpcChannel {
  // 기존 채널들
  ParseJsonFile = 'parse-json-file',
  ParseJsonString = 'parse-json-string',
  // 새 채널 추가
  ParseNewFormat = 'parse-new-format', // 예시
  // Apply 채널도 추가 (Parse 채널과 1:1 대응)
  ApplyTranslationToNewFormat = 'apply-translation-to-new-format', // 예시
}
```

## DTO 파일 만들기

새 파서를 위한 DTO(Data Transfer Object) 파일을 만드는 과정입니다.

### 1. 옵션 DTO 생성 (필수)

먼저 파서 옵션 DTO를 생성해야 합니다. 모든 옵션 DTO는 `BaseParseOptionsDto`를 상속해야 합니다:

```typescript
// src/nest/parser/dto/options/new-format-parser-options.dto.ts
import { BaseParseOptionsDto } from '@/nest/parser/dto/options/base-parse-options.dto';

export class NewFormatParserOptionsDto extends BaseParseOptionsDto {
  // 파서에 필요한 추가 옵션들
  someOption?: string;
  anotherOption?: boolean;
}
```

### 2. Request DTO 생성 (필수)

`src/nest/parser/dto/request` 디렉토리에 새 요청 DTO 파일을 생성합니다:

```typescript
// src/nest/parser/dto/request/parse-new-format-request.dto.ts
import { NewFormatParserOptionsDto } from '@/nest/parser/dto/options/new-format-parser-options.dto';
import { BaseParseRequestDto } from '@/nest/parser/dto/request/base-parse-request.dto';

export class ParseNewFormatRequestDto extends BaseParseRequestDto<NewFormatParserOptionsDto> {}
```

### 3. Apply DTO 생성 (필수)

모든 Request DTO에는 반드시 대응되는 Apply DTO가 있어야 합니다. Request DTO와 Apply DTO는 1:1로 대응되며, 동일한 옵션 DTO를 사용해야 합니다:

```typescript
// src/nest/parser/dto/request/apply-translation-to-new-format-request.dto.ts
import { NewFormatParserOptionsDto } from '@/nest/parser/dto/options/new-format-parser-options.dto';
import { BaseApplyRequestDto } from '@/nest/parser/dto/request/base-apply-request.dto';

export class ApplyTranslationToNewFormatRequestDto extends BaseApplyRequestDto<NewFormatParserOptionsDto> {}
```

> 중요: Request DTO와 Apply DTO는 반드시 동일한 옵션 DTO 타입(`NewFormatParserOptionsDto`)을 사용해야 합니다. 이는 파싱과 번역 적용 과정에서 일관된 옵션을 사용하기 위함입니다.

### 4. index.ts에 등록

`src/nest/parser/dto/index.ts` 파일에 새 DTO들을 등록합니다. 파싱 채널과 적용 채널 모두 등록해야 합니다:

```typescript
// import 추가
import { ParseNewFormatRequestDto } from './request/parse-new-format-request.dto';
import { ApplyTranslationToNewFormatRequestDto } from './request/apply-translation-to-new-format-request.dto';

export class ParserRequestResponse {
  // 기존 파서들
  
  // 새 파서 추가 - 반드시 Apply와 함께 추가
  [IpcChannel.ParseNewFormat]: {
    Request: ParseNewFormatRequestDto;
    Response: BaseParseResponseDto;
  };
  
  // Apply 추가 - 반드시 Parse와 쌍으로 추가
  [IpcChannel.ApplyTranslationToNewFormat]: {
    Request: ApplyTranslationToNewFormatRequestDto;
    Response: BaseApplyResponseDto;
  };
}
```

## Invoke에 등록하기

`ParserRequestResponse`에 등록된 새 채널은 자동으로 `IpcRequestResponse` 타입에 통합되어 `invoke` 함수에서 사용할 수 있게 됩니다.

이제 다음과 같이 호출할 수 있습니다:

```typescript
// 파싱 예시
const parseResult = await window.electron.ipcRenderer.invoke(
  IpcChannel.ParseNewFormat,
  {
    // ParseNewFormatRequestDto에 맞는 요청 객체
  }
);

// 번역 적용 예시
const applyResult = await window.electron.ipcRenderer.invoke(
  IpcChannel.ApplyTranslationToNewFormat,
  {
    // ApplyTranslationToNewFormatRequestDto에 맞는 요청 객체
  }
);
```

## 파서 구현체 작성

새 파서의 실제 구현체를 작성하는 단계입니다. 모든 파서는 `IParserService` 인터페이스를 구현해야 합니다.

### 1. 파서 서비스 생성

`src/nest/parser/service` 디렉토리에 새 파서 서비스 파일을 생성합니다:

```typescript
// src/nest/parser/service/new-format-parser.service.ts
import { Injectable } from '@nestjs/common';
import { IParserService } from '@/nest/parser/interface/parser-service.interface';
import { NewFormatParserOptionsDto } from '@/nest/parser/dto/options/new-format-parser-options.dto';

@Injectable()
export class NewFormatParserService implements IParserService<NewFormatParserOptionsDto> {
  parse(data: string, options?: NewFormatParserOptionsDto) {
    // 파싱 로직 구현
    // 반드시 IParserService 인터페이스에 정의된 메서드 구현
    return {
      // 파싱된 결과 반환
    };
  }
  
  applyTranslation(original: string, translated: any, options?: NewFormatParserOptionsDto) {
    // 번역 적용 로직 구현 - 반드시 parse와 동일한 옵션 타입 사용
    // 반드시 IParserService 인터페이스에 정의된 메서드 구현
    return '';
  }
}
```

### 2. 파서 모듈에 서비스 등록

`src/nest/parser/parser.module.ts` 파일에 새 파서 서비스를 등록합니다:

```typescript
// src/nest/parser/parser.module.ts
import { Module } from '@nestjs/common';
import { NewFormatParserService } from './service/new-format-parser.service';
// 기타 imports...

@Module({
  providers: [
    // 기존 서비스들...
    NewFormatParserService,
  ],
  exports: [
    // 기존 서비스들...
    NewFormatParserService,
  ],
})
export class ParserModule {}
```

### 3. IPC 핸들러에 등록

마지막으로 `src/nest/parser/ipc-handler` 디렉토리에 있는 컨트롤러에 새 IPC 채널 핸들러를 구현합니다:

```typescript
// src/nest/parser/ipc-handler/parser.ipc-handler.ts
import { IpcHandler } from '@/nest/common/decorator/ipc-handler.decorator';
import { IpcChannel } from '@/nest/common/ipc.channel';
import { ParseNewFormatRequestDto } from '@/nest/parser/dto/request/parse-new-format-request.dto';
import { ApplyTranslationToNewFormatRequestDto } from '@/nest/parser/dto/request/apply-translation-to-new-format-request.dto';
import { NewFormatParserService } from '@/nest/parser/service/new-format-parser.service';
// 기타 imports...

@Controller()
export class ParserIpcHandler {
  constructor(
    // 기존 서비스들...
    private readonly newFormatParserService: NewFormatParserService,
  ) {}

  // 기존 핸들러들...

  @IpcHandler(IpcChannel.ParseNewFormat)
  async parseNewFormat(request: ParseNewFormatRequestDto) {
    // 파싱 요청 처리
    const result = this.newFormatParserService.parse(
      request.data,
      request.options,
    );
    return {
      // 응답 반환
    };
  }

  @IpcHandler(IpcChannel.ApplyTranslationToNewFormat)
  async applyTranslationToNewFormat(request: ApplyTranslationToNewFormatRequestDto) {
    // 번역 적용 요청 처리
    const result = this.newFormatParserService.applyTranslation(
      request.original,
      request.translated,
      request.options,
    );
    return {
      // 응답 반환
    };
  }
}
```

### 요약

새 파서를 추가하기 위한 전체 단계:

1. IPC 채널 추가 (`ipc.channel.ts`)
2. 옵션 DTO 생성 (BaseParseOptionsDto 상속)
3. Request DTO 생성 (BaseParseRequestDto 상속)
4. Apply DTO 생성 (BaseApplyRequestDto 상속)
5. 파서 서비스 생성 (IParserService 인터페이스 구현)
6. 파서 모듈에 서비스 등록
7. IPC 핸들러에 핸들러 메서드 구현
8. dto/index.ts에 등록

이렇게 하면 새로운 파서가 프로젝트에 완전히 통합됩니다. 
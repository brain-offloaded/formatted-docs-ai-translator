# 새 파서 추가 가이드

이 문서는 프로젝트에 새로운 파서를 추가하는 방법에 대해 설명합니다. 모든 과정을 따라야만 합니다.

## 목차

- [새 파서 추가 가이드](#새-파서-추가-가이드)
  - [목차](#목차)
  - [IPC 채널 추가](#ipc-채널-추가)
  - [DTO 파일 만들기](#dto-파일-만들기)
    - [옵션 DTO 생성](#옵션-dto-생성)
    - [Request DTO 생성](#request-dto-생성)
    - [Response DTO 생성](#response-dto-생성)
    - [Apply DTO 생성](#apply-dto-생성)
    - [index.ts에 등록](#indexts에-등록)
  - [파서 구현체 작성](#파서-구현체-작성)
    - [파서 서비스 생성](#파서-서비스-생성)
    - [파서 모듈에 서비스 등록](#파서-모듈에-서비스-등록)
    - [ParserService에 로직 추가](#parserservice에-로직-추가)
    - [IPC 핸들러 수정](#ipc-핸들러-수정)
  - [Invoke 호출](#invoke-호출)
  - [요약](#요약)

## IPC 채널 추가

1.  `src/nest/common/ipc.channel.ts` 파일에 새 IPC 채널을 추가합니다. 파싱 채널과 번역 적용 채널은 항상 쌍으로 추가해야 합니다.

```typescript
// src/nest/common/ipc.channel.ts
export enum IpcChannel {
  // 기존 채널들
  ParseJson = 'parse-json',
  ApplyTranslationToJson = 'apply-translation-to-json',
  ParsePlainText = 'parse-plain-text',
  ApplyTranslationToPlainText = 'apply-translation-to-plain-text',
  ParseCsv = 'parse-csv',
  ApplyTranslationToCsv = 'apply-translation-to-csv',

  // 새 채널 추가 (예시)
  ParseNewFormat = 'parse-new-format',
  ApplyTranslationToNewFormat = 'apply-translation-to-new-format',
}
```

## DTO 파일 만들기

새 파서를 위한 DTO(Data Transfer Object) 파일을 만드는 과정입니다.

### 옵션 DTO 생성

먼저 파서 옵션 DTO를 생성해야 합니다. 모든 옵션 DTO는 `BaseParseOptionsDto`를 상속해야 합니다. `BaseParseOptionsDto`는 `sourceLanguage`와 `isFile` 옵션을 기본으로 제공합니다.

```typescript
// src/nest/parser/dto/options/new-format-parser-options.dto.ts
import { BaseParseOptionsDto } from '../options/base-parse-options.dto';

export class NewFormatParserOptionsDto extends BaseParseOptionsDto {
  // 파서에 필요한 추가 옵션들 (예: sourceLanguage, isFile 외)
  someOption?: string;
  anotherOption?: boolean;
}
```

### Request DTO 생성

`src/nest/parser/dto/request` 디렉토리에 새 요청 DTO 파일을 생성합니다. 모든 파싱 요청 DTO는 `BaseParseRequestDto`를 상속합니다. `BaseParseRequestDto`는 `content` (파싱 대상)와 `options` (파서 옵션) 속성을 가집니다.

```typescript
// src/nest/parser/dto/request/parse-new-format-request.dto.ts
import { NewFormatParserOptionsDto } from '@/nest/parser/dto/options/new-format-parser-options.dto';
import { BaseParseRequestDto } from '@/nest/parser/dto/request/base-parse-request.dto';

export class ParseNewFormatRequestDto extends BaseParseRequestDto<NewFormatParserOptionsDto> {}
```

### Response DTO 생성

각 파서는 전용 응답 DTO를 가져야 합니다. 모든 파싱 응답 DTO는 `BaseParseResponseDto`를 상속받아 만듭니다. `BaseParseResponseDto`는 `success`, `message`, `targets` 속성을 가지고 있으며, 여기서 `targets`는 파싱된 번역 대상 목록입니다. 일반적으로 `never` 타입을 제네릭 파라미터로 사용합니다. 이는 extra 데이터가 없음을 의미합니다. 필요할 경우 extra를 위한 dto를 직접 구현하여 사용합니다.

```typescript
// src/nest/parser/dto/response/parse-new-format-response.dto.ts
import { BaseParseResponseDto } from '@/nest/parser/dto/response/base-parse-response.dto';

export class ParseNewFormatResponseDto extends BaseParseResponseDto<never> {}
```

### Apply DTO 생성

모든 파싱 요청 DTO에는 반드시 대응되는 번역 적용 DTO가 있어야 합니다. `src/nest/parser/dto/request` 디렉토리에 새 번역 적용 DTO 파일을 생성합니다. 모든 번역 적용 DTO는 `BaseApplyRequestDto`를 상속합니다. `BaseApplyRequestDto`는 `content` (원본 내용), `translatedTextPaths` (번역 결과), `options` (파서 옵션) 속성을 가집니다.

`TExtra` 타입 파라미터는 TextPath, TranslatedTextPath에서 사용되는 추가 메타데이터의 타입입니다. 대부분의 경우 `never` 타입을 사용하여 추가 메타데이터가 없음을 나타냅니다.

```typescript
// src/nest/parser/dto/request/apply-translation-to-new-format-request.dto.ts
import { NewFormatParserOptionsDto } from '@/nest/parser/dto/options/new-format-parser-options.dto';
import { BaseApplyRequestDto } from '@/nest/parser/dto/request/base-apply-request.dto';

export class ApplyTranslationToNewFormatRequestDto extends BaseApplyRequestDto<
  never,
  NewFormatParserOptionsDto
> {}
```

> 중요: Request DTO와 Apply DTO는 반드시 동일한 옵션 DTO 타입(`NewFormatParserOptionsDto`)을 사용해야 합니다. 이는 파싱과 번역 적용 과정에서 일관된 옵션을 사용하기 위함입니다.

### index.ts에 등록

`src/nest/parser/dto/index.ts` 파일에 새로 만든 Request DTO, Response DTO, Apply DTO를 등록합니다.

```typescript
// src/nest/parser/dto/index.ts
import { IpcChannel } from '@/nest/common/ipc.channel';
// 기존 imports...
import { ParseNewFormatRequestDto } from './request/parse-new-format-request.dto';
import { ParseNewFormatResponseDto } from './response/parse-new-format-response.dto';
import { ApplyTranslationToNewFormatRequestDto } from './request/apply-translation-to-new-format-request.dto';
import { BaseApplyResponseDto } from './response/base-apply-response.dto';

export class ParserRequestResponse {
  // 기존 파서들...

  // 새 파서 추가 - 반드시 Apply와 함께 추가
  [IpcChannel.ParseNewFormat]: {
    Request: ParseNewFormatRequestDto;
    Response: ParseNewFormatResponseDto; // 특화된 응답 DTO 사용
  };

  // Apply 추가 - 반드시 Parse와 쌍으로 추가
  [IpcChannel.ApplyTranslationToNewFormat]: {
    Request: ApplyTranslationToNewFormatRequestDto;
    Response: BaseApplyResponseDto; // Apply는 BaseApplyResponseDto 사용
  };
}
```

## 파서 구현체 작성

새 파서의 실제 구현체를 작성하는 단계입니다.

### 파서 서비스 생성

`src/nest/parser/services` 디렉토리에 새 파서 서비스 파일을 생성합니다. 모든 파서 서비스는 `BaseParserService` 추상 클래스를 상속받아 구현해야 합니다.

`BaseParserService`는 다음과 같은 제네릭 타입을 받습니다:
-   `TargetFormat`: 파싱 결과로 변환될 데이터의 형태 (예: `string`, `Record<string, unknown>`)
-   `ParserOptions`: 해당 파서에서 사용할 옵션 DTO 타입 (예: `NewFormatParserOptionsDto`)
-   `ParsedInformation`: `getTranslationTargets` 메서드가 반환할 번역 대상 정보의 타입 (기본값: `SimpleTextPath` = `TextPath<never>`)
-   `TranslatedInformation`: `applyTranslation` 메서드가 받을 번역 결과 정보의 타입 (기본값: `SimpleTranslatedTextPath` = `TranslatedTextPath<never>`)

간단한 파서의 경우 첫 두 개의 타입 매개변수만 지정하고, 나머지는 기본값을 사용할 수 있습니다:

```typescript
// src/nest/parser/services/new-format-parser.service.ts
import { Injectable } from '@nestjs/common';
import { BaseParserService } from './base-parser-service';
import { NewFormatParserOptionsDto } from '@/nest/parser/dto/options/new-format-parser-options.dto';
import { SimpleTextPath, SimpleTranslatedTextPath } from '@/types/common'; // 필요한 타입 import

@Injectable()
export class NewFormatParserService extends BaseParserService<
  string, // 파싱 결과가 문자열 형태일 경우
  NewFormatParserOptionsDto
> {
  // BaseParserService의 추상 메서드 구현 (필수)

  async getTranslationTargets(params: {
    source: string; // content (파일 경로 또는 문자열)
    options: NewFormatParserOptionsDto;
  }): Promise<SimpleTextPath[]> {
    // 1. params.source와 params.options.isFile을 사용하여 데이터를 읽음 (this.read(params) 사용 권장)
    const targetData: string = await this.read(params);

    // 2. targetData에서 번역 대상(TextPath) 목록 추출 로직 구현
    const targets: SimpleTextPath[] = [];
    // ... 로직 구현 ...
    return targets;
  }

  async applyTranslation(params: {
    source: string; // original content (파일 경로 또는 문자열)
    translations: SimpleTranslatedTextPath[]; // 번역된 텍스트 목록
    options: NewFormatParserOptionsDto;
  }): Promise<string> { // TargetFormat과 동일한 타입 반환
    // 1. params.source와 params.options.isFile을 사용하여 원본 데이터를 읽음 (this.read(params) 사용 권장)
    const originalData: string = await this.read({ source: params.source, options: params.options });

    // 2. originalData에 params.translations를 적용하는 로직 구현
    let result = originalData;
    // ... 로직 구현 ...
    return result; // TargetFormat 타입의 결과 반환
  }

  // 필요한 경우 BaseParserService의 메서드 오버라이드
  // 예: readString 메서드 오버라이드
  // async readString(content: string, _options: NewFormatParserOptionsDto): Promise<string> {
  //   // 사용자 정의 문자열 처리 로직
  //   return super.readString(content, _options); // 또는 완전히 새로운 구현
  // }
}
```

`SimpleTextPath`와 `SimpleTranslatedTextPath`는 각각 `TextPath<never>`와 `TranslatedTextPath<never>`의 별칭으로, 추가 메타데이터가 없는 단순한 경우에 사용됩니다.

### 파서 모듈에 서비스 등록

`src/nest/parser/parser.module.ts` 파일의 `providers` 배열에 새로 만든 파서 서비스를 등록합니다.

```typescript
// src/nest/parser/parser.module.ts
import { Module } from '@nestjs/common';
import { NewFormatParserService } from './services/new-format-parser.service';
import { ParserService } from './services/parser.service';
import { ParserIpcHandler } from './parser.ipc.handler';
// 기타 imports...

@Module({
  providers: [
    ParserService, // 중앙 파서 서비스
    ParserIpcHandler, // IPC 핸들러
    // 기존 파서 서비스들...
    NewFormatParserService, // 새 파서 서비스 추가
  ],
  exports: [ParserService], // ParserService만 export
})
export class ParserModule {}
```

### ParserService에 로직 추가

`src/nest/parser/services/parser.service.ts` 파일을 수정하여 새로운 파서 기능을 중앙에서 관리하도록 합니다.

1.  `constructor`에 새로 만든 파서 서비스(`NewFormatParserService`)를 주입합니다.
2.  새로운 파서를 위한 `get...TranslationTargets` 메서드와 `apply...Translation` 메서드를 추가합니다. 이 메서드들은 주입받은 새 파서 서비스의 해당 메서드를 호출합니다.

```typescript
// src/nest/parser/services/parser.service.ts
import { Injectable } from '@nestjs/common';
import { NewFormatParserService } from './new-format-parser.service'; // 새 서비스 import
import { NewFormatParserOptionsDto } from '@/nest/parser/dto/options/new-format-parser-options.dto'; // 새 옵션 DTO import
import { SimpleTextPath, SimpleTranslatedTextPath } from '@/types/common';
// 기타 imports...

@Injectable()
export class ParserService {
  constructor(
    // 기존 서비스들...
    private readonly newFormatParserService: NewFormatParserService, // 새 서비스 주입
  ) {}

  // 기존 메서드들...

  // 새 파서를 위한 getTranslationTargets 메서드 추가
  public async getNewFormatTranslationTargets(
    content: string,
    options: NewFormatParserOptionsDto
  ): Promise<SimpleTextPath[]> {
    return await this.newFormatParserService.getTranslationTargets({
      source: content,
      options,
    });
  }

  // 새 파서를 위한 applyTranslation 메서드 추가
  public async applyNewFormatTranslation(
    content: string,
    translations: SimpleTranslatedTextPath[],
    options: NewFormatParserOptionsDto
  ): Promise<string> { // NewFormatParserService의 TargetFormat과 일치시켜야 함
    return await this.newFormatParserService.applyTranslation({
      source: content,
      translations,
      options,
    });
  }
}
```

### IPC 핸들러 수정

`src/nest/parser/parser.ipc.handler.ts` 파일에 새로운 IPC 채널을 처리하는 핸들러 메서드를 추가합니다. `@HandleIpc` 데코레이터를 사용하고, `ParserService`의 해당 메서드를 호출합니다.

```typescript
// src/nest/parser/parser.ipc.handler.ts
import { Injectable } from '@nestjs/common';
import { IpcMainInvokeEvent } from 'electron';
import { InvokeFunctionRequest, InvokeFunctionResponse } from '../../types/electron';
import { IpcHandler, HandleIpc } from '../common/ipc.handler';
import { IpcChannel } from '../common/ipc.channel';
import { LoggerService } from '../logger/logger.service';
import { ParserService } from './services/parser.service';
// 필요한 DTO import 추가
import { ParseNewFormatRequestDto } from './dto/request/parse-new-format-request.dto';
import { ParseNewFormatResponseDto } from './dto/response/parse-new-format-response.dto';
import { ApplyTranslationToNewFormatRequestDto } from './dto/request/apply-translation-to-new-format-request.dto';
import { BaseApplyResponseDto } from './dto/response/base-apply-response.dto';

@Injectable()
export class ParserIpcHandler extends IpcHandler {
  constructor(
    private readonly parserService: ParserService,
    protected readonly logger: LoggerService
  ) {
    super();
  }

  // 기존 핸들러들...

  // 새 파싱 채널 핸들러 추가
  @HandleIpc(IpcChannel.ParseNewFormat)
  async parseNewFormat(
    event: IpcMainInvokeEvent,
    { content, options }: InvokeFunctionRequest<IpcChannel.ParseNewFormat> // Request DTO 사용
  ): Promise<InvokeFunctionResponse<IpcChannel.ParseNewFormat>> { // Response DTO 사용
    try {
      const targets = await this.parserService.getNewFormatTranslationTargets(content, options);
      return {
        success: true,
        targets,
        message: 'NewFormat 파싱 성공', // 성공 메시지
      };
    } catch (error) {
      this.logger.error('NewFormat 파싱 중 오류 발생:', { error });
      return {
        success: false,
        message: error instanceof Error ? error.message : '알 수 없는 오류',
        targets: [], // 실패 시 빈 배열 반환
      };
    }
  }

  // 새 번역 적용 채널 핸들러 추가
  @HandleIpc(IpcChannel.ApplyTranslationToNewFormat)
  async applyTranslationToNewFormat(
    event: IpcMainInvokeEvent,
    { content, translatedTextPaths, options }: InvokeFunctionRequest<IpcChannel.ApplyTranslationToNewFormat> // Request DTO 사용
  ): Promise<InvokeFunctionResponse<IpcChannel.ApplyTranslationToNewFormat>> { // Response DTO 사용
    try {
      const result = await this.parserService.applyNewFormatTranslation(
        content,
        translatedTextPaths,
        options
      );
      return {
        success: true,
        result, // ParserService에서 반환된 결과
        message: 'NewFormat 번역 적용 성공', // 성공 메시지
      };
    } catch (error) {
      this.logger.error('NewFormat 번역 적용 중 오류 발생:', { error });
      return {
        success: false,
        message: error instanceof Error ? error.message : '알 수 없는 오류',
        result: '', // 실패 시 빈 문자열 또는 적절한 기본값 반환
      };
    }
  }
}
```

## Invoke 호출

`ParserRequestResponse`에 등록된 새 채널은 자동으로 타입 추론이 가능해져 `invoke` 함수에서 사용할 수 있게 됩니다.

다음과 같이 Renderer 프로세스에서 호출할 수 있습니다:

```typescript
// 파싱 예시
const parseResult = await window.electron.ipcRenderer.invoke(
  IpcChannel.ParseNewFormat,
  {
    // ParseNewFormatRequestDto에 맞는 요청 객체
    content: '파일 경로 또는 파싱할 문자열',
    options: {
      sourceLanguage: 'en',
      isFile: true, // content가 파일 경로인 경우 true
      someOption: 'value', // NewFormatParserOptionsDto에 정의된 추가 옵션
    }
  }
);

if (parseResult.success) {
  console.log('파싱 성공:', parseResult.targets);
} else {
  console.error('파싱 실패:', parseResult.message);
}

// 번역 적용 예시
const applyResult = await window.electron.ipcRenderer.invoke(
  IpcChannel.ApplyTranslationToNewFormat,
  {
    // ApplyTranslationToNewFormatRequestDto에 맞는 요청 객체
    content: '원본 파일 경로 또는 문자열',
    translatedTextPaths: [
      { path: 'some.path', text: 'original text', translatedText: '번역된 텍스트' },
      // ... 번역된 결과 목록
    ],
    options: {
      sourceLanguage: 'en',
      isFile: true,
      someOption: 'value',
    }
  }
);

if (applyResult.success) {
  console.log('번역 적용 성공:', applyResult.result);
} else {
  console.error('번역 적용 실패:', applyResult.message);
}
```

## 요약

새 파서를 추가하기 위한 전체 단계:

1.  **IPC 채널 추가:** `ipc.channel.ts`에 Parse, Apply 채널 쌍 추가
2.  **옵션 DTO 생성:** `dto/options/`에 `BaseParseOptionsDto` 상속 DTO 생성
3.  **Request DTO 생성:** `dto/request/`에 `BaseParseRequestDto` 상속 DTO 생성
4.  **Response DTO 생성:** `dto/response/`에 `BaseParseResponseDto` 상속 DTO 생성
5.  **Apply DTO 생성:** `dto/request/`에 `BaseApplyRequestDto` 상속 DTO 생성
6.  **dto/index.ts 등록:** 생성한 DTO들을 `ParserRequestResponse`에 등록
7.  **파서 서비스 생성:** `services/`에 `BaseParserService` 상속 서비스 생성 (`getTranslationTargets`, `applyTranslation` 구현)
8.  **파서 모듈 등록:** `parser.module.ts`의 `providers`에 새 파서 서비스 등록
9.  **ParserService 수정:** `services/parser.service.ts`에 새 파서 서비스 주입 및 관련 메서드 추가
10. **IPC 핸들러 수정:** `parser.ipc.handler.ts`에 `@HandleIpc` 데코레이터로 새 채널 핸들러 추가 (ParserService 호출)

이렇게 하면 새로운 파서가 프로젝트에 완전히 통합됩니다. 
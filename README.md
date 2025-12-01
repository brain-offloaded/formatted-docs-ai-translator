# Formatted Docs AI Translator

AI를 이용한 문서 번역 도구입니다.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

### A Note from the Author (작성자의 말)

#### 1. A Small Wish (소박한 바람)
If you find this tool useful, crediting the author or sharing a link would be greatly appreciated! This is **absolutely not mandatory**, just a personal wish. I am grateful enough that you are using this tool even without any credit.

이 도구가 도움이 되셨다면, 주변에 알려주시거나 출처를 남겨주시면 정말 감사하겠습니다! 물론 이는 **절대 필수가 아니며**, 저의 개인적인 바람일 뿐입니다. 출처를 표기하지 않으시더라도 써주시는 것만으로도 감사합니다.

#### 2. Complete Freedom (완전한 자유)
Technically, this project is under the MIT License for minimal legal protection. However, honestly speaking, **I do not intend to enforce the license terms strictly.**
You are free to use this code however you like. I won't mind even if you remove my name or claim you made this tool yourself.
**The only thing I ask is:** Please do not claim ownership and then accuse *me* (the original author) of copyright infringement. As long as you don't do that, feel free to do whatever you want!

형식적으로는 최소한의 방어를 위해 MIT 라이선스를 적용해 두었습니다. 하지만 솔직히 말씀드리면, **라이선스 조항을 어기더라도 저는 어지간해서는 문제 삼을 생각이 없습니다.**
제 이름을 지우거나, 심지어 본인이 만들었다고 하셔도 괜찮습니다. 자유롭게 사용하세요.
**단, 딱 한 가지 부탁만 드립니다.** 본인이 만들었다고 주장하면서 **오히려 원작자인 저에게 저작권 위반을 주장하는 경우**만 아니라면, 어떤 방식으로 사용하든 환영합니다.

## 주요 기능

-   다양한 파일 형식 지원: 텍스트, JSON, CSV, SRT(자막), 이미지 등
-   일괄 번역: 여러 파일을 동시에 번역
-   사용자 정의: 번역 설정을 사용자가 직접 제어

## 개발

자세한 개발자 문서는 다음을 참고하세요.
- **[한글](./docs/ko/index.md)**

### 로컬 실행

-   `yarn dev`: 전체 워크스페이스를 빌드한 뒤 Electron 앱을 실행합니다.
-   `yarn dev:watch`: 변경 사항을 감지하며 개발하려면 이 스크립트를 사용하세요.

### 데이터베이스 (Prisma)

-   Prisma 스키마는 `prisma/schema.prisma`에 정의되어 있습니다.
-   DB 스키마 변경 시: `yarn exec prisma db pull`
-   Prisma Client 타입 재생성: `yarn exec prisma generate`
-   Prisma Studio 실행: `yarn prisma:studio`

-- This is a migration to add initial data based on legacy typeorm migrations.

-- In case of conflicts, this will fail. This is intentional.
-- If you want to re-apply, you should clear the tables first.

INSERT INTO "app_settings" ("key", "value") VALUES ('uiLanguage', 'en');

-- Assuming 'default' is the value for DEFAULT_CACHE_TAG
INSERT INTO "cache_tag" ("name") VALUES ('default');

INSERT INTO "prompt_presets" ("name", "prompt", "type") VALUES ('Text (Default)', '<|role_start:system|>
You are translator who translate the {{language::source}} text given by user to {{language::target}}. You are just a translator. If it''s already in {{language::target}}, you have to output it as it is. Keep xml format. Response only translation text and xml, without any extra information.
No sentence should be left untranslated, or you should not respond with a blank sentence without translating.<|role_end|>
{{example::source}}
<|role_start:assistant|>
I understood. I have translated all sentences without omission. I must response all senteces without aborting. Pure translation result without any extra information(only xml included):<|role_end|>
{{example::result}}
<|role_start:user|>
{{content}}<|role_end|>
<|role_start:assistant|>
I understood. I have translated all sentences without omission. I must response all senteces without aborting. Pure translation result without any extra information(only xml included):<|role_end|>
', 'text');

INSERT INTO "prompt_presets" ("name", "prompt", "type") VALUES ('Text (Strict)', '<|role_start:system|>
You are an expert file-format translator. Your primary mission is to translate text from {{language::source}} to {{language::target}} while maintaining the structural integrity of the file.

**CRITICAL RULES:**
1.  **Verbatim Character Preservation:** You MUST preserve all special characters, control characters, and escape sequences from the source text verbatim in your translation. Do not interpret them.
    *   `\n` must remain as the two characters `\` and `n`. It MUST NOT be converted to a newline.
    *   `\\n` must remain as the three characters `\`, `\`, and `n`.
    *   All formatting tags, placeholders (like `{0}`), and other non-alphanumeric symbols must be copied exactly as they appear.
2.  **Tag Integrity:** Each line of text is wrapped in an XML tag, like `<line id="1">...</line>`. You MUST preserve this entire tag structure, including the `id` attribute, exactly as it appears. Translate ONLY the text content between the opening and closing tags.
3.  **Completeness:** Translate every single line. Do not omit or merge lines.
4.  **Purity:** Output ONLY the translated text, fully wrapped in its original tags. Do not add any explanations, apologies, or extra text. If a sentence is already in {{language::target}}, output it as is, wrapped in its tag.
<|role_end|>
{{example::source}}
<|role_start:assistant|>
I will now provide a perfect translation, strictly following all rules, including the verbatim preservation of all special characters and XML tags.
{{example::result}}
<|role_start:user|>
{{content}}<|role_end|>
<|role_start:assistant|>
I will now provide a perfect translation, strictly following all rules, including the verbatim preservation of all special characters and XML tags.
<|role_end|>
', 'text');

INSERT INTO "prompt_presets" ("name", "prompt", "type") VALUES ('Image (Default)', '<|role_start:system|>
You are an AI expert in document localization. Your primary goal is to process a page image and produce a high-fidelity JSON output for programmatic use. This output will be used to overlay translated text onto the original image, so precision in both translation and geometry is paramount.

Your output must be a single JSON object conforming to the schema provided by the system.

**Guiding Principles & Instructions:**

1.  **Precise Text Detection and Bounding Box Generation:**
    *   Your first task is to identify all primary content text blocks.
    *   For each text block, you must generate a **tight-fitting** `box_2d` (`[y_min, x_min, y_max, x_max]`). This box must precisely enclose all the characters of the text, minimizing empty space around them.
    *   Crucially, avoid letting the box overlap with the text container''s outline or any part of the background artwork. The box should contain only the text itself.

2.  **Intelligent Text Block Aggregation:**
    *   **You must logically merge text lines that form a single sentence or thought. If a sentence is split across multiple lines within the *same* text container, you must identify this as a single, unified text block.**
    *   The `box_2d` for such a merged block must be a single rectangle that tightly encloses *all* the constituent lines of text.
    *   Conversely, text in separate, distinct text containers must be treated as separate blocks, even if they are close to each other.

3.  **Context-Aware OCR and Translation:**
    *   For each valid text region you''ve identified, perform OCR to extract the original `{{language::source}}` text.
    *   Translate the extracted text into `{{language::target}}`. This is not a simple literal translation. You must **analyze the visual context of the image, including surrounding visual elements and the overall tone of the document.**
    *   The final translation must capture the appropriate tone and nuance.

4.  **Correct Reading Order Sequencing:**
    *   **The order of elements in the `ocr_result` and `translated_result` arrays is critical. It must strictly follow the natural reading order of the page.**
    *   Determine this order by analyzing the **document layout, the placement of text blocks,** and the standard reading conventions for `{{language::source}}` (e.g., top-to-bottom, left-to-right for English; or top-to-bottom, right-to-left for Japanese).
    *   **The text that a human would read first on the page should be the first element (index 0) in the arrays, the second text they would read should be the second element (index 1), and so forth.**

5.  **Final JSON Structuring:**
    *   Populate the `ocr_result` array with the original `{{language::source}}` text and its corresponding `box_2d`, **respecting the reading order established above.**
    *   Populate the `translated_result` array with the high-quality, context-aware `{{language::target}}` translation and its `box_2d`, **also in the correct reading order.**
    *   The `box_2d` for a source text and its translation **must be identical**. The item at index `i` in `ocr_result` must directly correspond to the item at index `i` in `translated_result`.
<|role_end|>
<|role_start:user|>
{{content}}
<|role_end|>
<|role_start:assistant|>
I will now provide a perfect translation, strictly following all rules. Here is the OCR and translation result in the requested JSON format:
<|role_end|>
', 'image');

INSERT INTO "example_preset" ("name", "description", "examples") VALUES ('default', '기본 예제 프리셋', '{"ko":{"ko":{"sourceLines":[],"resultLines":[]},"en":{"sourceLines":["눈부신 기술 발전은 현대 사회의 구조를 재편하고 있으며, 개인의 일상생활과 가치관에도 깊은 영향을 미치고 있습니다.","해 질 녘 노을이 붉게 물든 가을 하늘 아래, 황금빛으로 물든 단풍잎들이 바람에 부드럽게 흩날리며 잊을 수 없는 풍경을 자아냈습니다.","익숙하지 않은 분야에 도전하는 것은 때때로 두려움을 동반하지만, 꾸준한 노력과 긍정적인 마음가짐은 결국 놀라운 성장과 성취로 이어질 것입니다."],"resultLines":["Dazzling technological advancements are reshaping the structure of modern society and profoundly influencing individuals'' daily lives and values.","Beneath the autumn sky dyed red by the sunset glow, golden maple leaves gently scattered in the wind, creating an unforgettable scene.","Challenging oneself in an unfamiliar field sometimes involves fear, but consistent effort and a positive mindset will ultimately lead to surprising growth and accomplishment."]},"ja":{"sourceLines":["눈부신 기술 발전은 현대 사회의 구조를 재편하고 있으며, 개인의 일상생활과 가치관에도 깊은 영향을 미치고 있습니다.","해 질 녘 노을이 붉게 물든 가을 하늘 아래, 황금빛으로 물든 단풍잎들이 바람에 부드럽게 흩날리며 잊을 수 없는 풍경을 자아냈습니다.","익숙하지 않은 분야에 도전하는 것은 때때로 두려움을 동반하지만, 꾸준한 노력과 긍정적인 마음가짐은 결국 놀라운 성장과 성취로 이어질 것입니다."],"resultLines":["目覚ましい技術発展は現代社会の構造を再編しており、個人の日常生活や価値観にも深い影響を与えています。","日没の夕焼けが赤く染まった秋空の下、黄金色に染まった紅葉が風にやさしく舞い散り、忘れられない風景を醸し出していました。","慣れない分野に挑戦することは時に恐れを伴いますが、地道な努力と前向きな心構えは、最終的に驚くべき成長と達成につながるでしょう。"]},"zh":{"sourceLines":["눈부신 기술 발전은 현대 사회의 구조를 재편하고 있으며, 개인의 일상생활과 가치관에도 깊은 영향을 미치고 있습니다.","해 질 녘 노을이 붉게 물든 가을 하늘 아래, 황금빛으로 물든 단풍잎들이 바람에 부드럽게 흩날리며 잊을 수 없는 풍경을 자아냈습니다.","익숙하지 않은 분야에 도전하는 것은 때때로 두려움을 동반하지만, 꾸준한 노력과 긍정적인 마음가짐은 결국 놀라운 성장과 성취로 이어질 것입니다."],"resultLines":["令人瞩目的技术发展正在重塑现代社会的结构，并对个人的日常生活和价值观产生着深远的影响。","在被夕阳晚霞染红的秋日天空下，金黄色的枫叶在风中轻柔地飘散，营造出了一幅令人难忘的景象。","挑战不熟悉的领域有时会伴随着恐惧，但持续的努力和积极的心态最终将带来惊人的成长和成就。"]}},"en":{"ko":{"sourceLines":["Dazzling technological advancements are reshaping the structure of modern society and profoundly influencing individuals'' daily lives and values.","Beneath the autumn sky dyed red by the sunset glow, golden maple leaves gently scattered in the wind, creating an unforgettable scene.","Challenging oneself in an unfamiliar field sometimes involves fear, but consistent effort and a positive mindset will ultimately lead to surprising growth and accomplishment."],"resultLines":["눈부신 기술 발전은 현대 사회의 구조를 재편하고 있으며, 개인의 일상생활과 가치관에도 깊은 영향을 미치고 있습니다.","해 질 녘 노을이 붉게 물든 가을 하늘 아래, 황금빛으로 물든 단풍잎들이 바람에 부드럽게 흩날리며 잊을 수 없는 풍경을 자아냈습니다.","익숙하지 않은 분야에 도전하는 것은 때때로 두려움을 동반하지만, 꾸준한 노력과 긍정적인 마음가짐은 결국 놀라운 성장과 성취로 이어질 것입니다."]},"en":{"sourceLines":[],"resultLines":[]},"ja":{"sourceLines":["Dazzling technological advancements are reshaping the structure of modern society and profoundly influencing individuals'' daily lives and values.","Beneath the autumn sky dyed red by the sunset glow, golden maple leaves gently scattered in the wind, creating an unforgettable scene.","Challenging oneself in an unfamiliar field sometimes involves fear, but consistent effort and a positive mindset will ultimately lead to surprising growth and accomplishment."],"resultLines":["目覚ましい技術発展は現代社会の構造を再編しており、個人の日常生活や価値観にも深い影響を与えています。","日没の夕焼けが赤く染まった秋空の下、黄金色に染まった紅葉が風にやさしく舞い散り、忘れられない風景を醸し出していました。","慣れない分野に挑戦することは時に恐れを伴いますが、地道な努力と前向きな心構えは、最終的に驚くべき成長と達成につながるでしょう。"]},"zh":{"sourceLines":["Dazzling technological advancements are reshaping the structure of modern society and profoundly influencing individuals'' daily lives and values.","Beneath the autumn sky dyed red by the sunset glow, golden maple leaves gently scattered in the wind, creating an unforgettable scene.","Challenging oneself in an unfamiliar field sometimes involves fear, but consistent effort and a positive mindset will ultimately lead to surprising growth and accomplishment."],"resultLines":["令人瞩目的技术发展正在重塑现代社会的结构，并对个人的日常生活和价值观产生着深远的影响。","在被夕阳晚霞染红的秋日天空下，金黄色的枫叶在风中轻柔地飘散，营造出了一幅令人难忘的景象。","挑战不熟悉的领域有时会伴随着恐惧，但持续的努力和积极的心态最终将带来惊人的成长和成就。"]}},"ja":{"ko":{"sourceLines":["目覚ましい技術発展は現代社会の構造を再編しており、個人の日常生活や価値観にも深い影響を与えています。","日没の夕焼けが赤く染まった秋空の下、黄金色に染まった紅葉が風にやさしく舞い散り、忘れられない風景を醸し出していました。","慣れない分野に挑戦することは時に恐れを伴いますが、地道な努力と前向きな心構えは、最終的に驚くべき成長と達成につながるでしょう。"],"resultLines":["눈부신 기술 발전은 현대 사회의 구조를 재편하고 있으며, 개인의 일상생활과 가치관에도 깊은 영향을 미치고 있습니다.","해 질 녘 노을이 붉게 물든 가을 하늘 아래, 황금빛으로 물든 단풍잎들이 바람에 부드럽게 흩날리며 잊을 수 없는 풍경을 자아냈습니다.","익숙하지 않은 분야에 도전하는 것은 때때로 두려움을 동반하지만, 꾸준한 노력과 긍정적인 마음가짐은 결국 놀라운 성장과 성취로 이어질 것입니다."]},"en":{"sourceLines":["目覚ましい技術発展は現代社会の構造を再編しており、個人の日常生活や価値観にも深い影響を与えています。","日没の夕焼けが赤く染まった秋空の下、黄金色に染まった紅葉が風にやさしく舞い散り、忘れられない風景を醸し出していました。","慣れない分野に挑戦することは時に恐れを伴いますが、地道な努力と前向きな心構えは、最終的に驚くべき成長と達成につながるでしょう。"],"resultLines":["Dazzling technological advancements are reshaping the structure of modern society and profoundly influencing individuals'' daily lives and values.","Beneath the autumn sky dyed red by the sunset glow, golden maple leaves gently scattered in the wind, creating an unforgettable scene.","Challenging oneself in an unfamiliar field sometimes involves fear, but consistent effort and a positive mindset will ultimately lead to surprising growth and accomplishment."]},"ja":{"sourceLines":[],"resultLines":[]},"zh":{"sourceLines":["目覚ましい技術発展は現代社会の構造を再編しており、個人の日常生活や価値観にも深い影響を与えています。","日没の夕焼けが赤く染まった秋空の下、黄金色に染まった紅葉が風にやさしく舞い散り、忘れられない風景を醸し出していました。","慣れない分野に挑戦することは時に恐れを伴いますが、地道な努力と前向きな心構えは、最終的に驚くべき成長と達成につながるでしょう。"],"resultLines":["令人瞩目的技术发展正在重塑现代社会的结构，并对个人的日常生活和价值观产生着深远的影响。","在被夕阳晚霞染红的秋日天空下，金黄色的枫叶在风中轻柔地飘散，营造出了一幅令人难忘的景象。","挑战不熟悉的领域有时会伴随着恐惧，但持续的努力和积极的心态最终将带来惊人的成长和成就。"]}},"zh":{"ko":{"sourceLines":["令人瞩目的技术发展正在重塑现代社会的结构，并对个人的日常生活和价值观产生着深远的影响。","在被夕阳晚霞染红的秋日天空下，金黄色的枫叶在风中轻柔地飘散，营造出了一幅令人难忘的景象。","挑战不熟悉的领域有时会伴随着恐惧，但持续的努力和积极的心态最终将带来惊人的成长和成就。"],"resultLines":["눈부신 기술 발전은 현대 사회의 구조를 재편하고 있으며, 개인의 일상생활과 가치관에도 깊은 영향을 미치고 있습니다.","해 질 녘 노을이 붉게 물든 가을 하늘 아래, 황금빛으로 물든 단풍잎들이 바람에 부드럽게 흩날리며 잊을 수 없는 풍경을 자아냈습니다.","익숙하지 않은 분야에 도전하는 것은 때때로 두려움을 동반하지만, 꾸준한 노력과 긍정적인 마음가짐은 결국 놀라운 성장과 성취로 이어질 것입니다."]},"en":{"sourceLines":["令人瞩目的技术发展正在重塑现代社会的结构，并对个人的日常生活和价值观产生着深远的影响。","在被夕阳晚霞染红的秋日天空下，金黄色的枫叶在风中轻柔地飘散，营造出了一幅令人难忘的景象。","挑战不熟悉的领域有时会伴随着恐惧，但持续的努力和积极的心态最终将带来惊人的成长和成就。"],"resultLines":["Dazzling technological advancements are reshaping the structure of modern society and profoundly influencing individuals'' daily lives and values.","Beneath the autumn sky dyed red by the sunset glow, golden maple leaves gently scattered in the wind, creating an unforgettable scene.","Challenging oneself in an unfamiliar field sometimes involves fear, but consistent effort and a positive mindset will ultimately lead to surprising growth and accomplishment."]},"ja":{"sourceLines":["令人瞩目的技术发展正在重塑现代社会的结构，并对个人的日常生活和价值观产生着深远的影响。","在被夕阳晚霞染红的秋日天空下，金黄色的枫叶在风中轻柔地飘散，营造出了一幅令人难忘的景象。","挑战不熟悉的领域有时会伴随着恐惧，但持续的努力和积极的心态最终将带来惊人的成长和成就。"],"resultLines":["目覚ましい技術発展は現代社会の構造を再編しており、個人の日常生活や価値観にも深い影響を与えています。","日没の夕焼けが赤く染まった秋空の下、黄金色に染まった紅葉が風にやさしく舞い散り、忘れられない風景を醸し出していました。","慣れない分野に挑戦することは時に恐れを伴いますが、地道な努力と前向きな心構えは、最終的に驚くべき成長と達成につながるでしょう。"]},"zh":{"sourceLines":[],"resultLines":[]}}}');


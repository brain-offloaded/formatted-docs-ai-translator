import { TranslatorEngine } from '@/react/unified/engine/translator-engine';
import { TranslationInput } from '@/react/unified/domain/translation-input';
import { TranslationOutput } from '@/react/unified/domain/translation-output';
import { TranslationUnit } from '@/react/unified/domain/translation-unit';
import type { AiTranslatorConfig } from '@/react/types/config';
import type { IApplier } from '@/react/unified/applier/i-applier';
import { batchTranslateParsedResults } from '../batch-translation';

describe('batchTranslateParsedResults', () => {
  const dummyConfig = {} as AiTranslatorConfig;

  const createTranslationInput = (content: string) =>
    new TranslationInput(content, { isFile: false }, dummyConfig);

  const createParsedResult = (
    content: string,
    parsed: TranslationUnit[],
    applyMock: jest.MockedFunction<
      NonNullable<IApplier<TranslationInput, TranslationUnit[], TranslationOutput>['apply']>
    >
  ) => ({
    translationInput: createTranslationInput(content),
    parsed,
    applier: { apply: applyMock } as IApplier<
      TranslationInput,
      TranslationUnit[],
      TranslationOutput
    >,
  });

  it('aggregates multiple files into one request and applies per file', async () => {
    const translateUnitsMock = jest.fn<
      Promise<TranslationUnit[]>,
      [TranslationUnit[], AiTranslatorConfig, string | undefined]
    >(async (units) =>
      units.map((unit: TranslationUnit) => ({ ...unit, target: `${unit.source}-tr` }))
    );

    const translatorEngine = {
      translateUnits: translateUnitsMock,
    } as unknown as TranslatorEngine<TranslationInput, TranslationUnit[], TranslationOutput>;

    const firstApply = jest.fn(async (_input, translatedUnits) => {
      const value = translatedUnits.map((unit: TranslationUnit) => unit.target ?? '').join('|');
      return new TranslationOutput([{ name: 'first.txt', success: true, result: value }]);
    });

    const secondApply = jest.fn(async (_input, translatedUnits) => {
      const value = translatedUnits.map((unit: TranslationUnit) => unit.target ?? '').join('|');
      return new TranslationOutput([{ name: 'second.txt', success: true, result: value }]);
    });

    const parsedResults = [
      createParsedResult(
        'first content',
        [
          { key: 'line_0', source: 'hello' },
          { key: 'line_1', source: 'world' },
        ],
        firstApply
      ),
      createParsedResult('second content', [{ key: 'line_0', source: 'foo' }], secondApply),
    ];

    const outputs = await batchTranslateParsedResults({
      translatorEngine,
      parsedResults,
      config: dummyConfig,
      promptPresetContent: 'preset',
    });

    expect(translateUnitsMock).toHaveBeenCalledTimes(1);
    expect(translateUnitsMock.mock.calls[0][0]).toHaveLength(3);
    expect(translateUnitsMock.mock.calls[0][2]).toBe('preset');

    expect(firstApply).toHaveBeenCalledWith(parsedResults[0].translationInput, [
      { key: 'line_0', source: 'hello', target: 'hello-tr' },
      { key: 'line_1', source: 'world', target: 'world-tr' },
    ]);
    expect(secondApply).toHaveBeenCalledWith(parsedResults[1].translationInput, [
      { key: 'line_0', source: 'foo', target: 'foo-tr' },
    ]);

    expect(outputs).toHaveLength(2);
    expect(outputs[0].getResults()[0].result).toBe('hello-tr|world-tr');
    expect(outputs[1].getResults()[0].result).toBe('foo-tr');
  });

  it('namespaces duplicate keys across files before translating and restores original keys on apply', async () => {
    const translateUnitsMock = jest.fn<
      Promise<TranslationUnit[]>,
      [TranslationUnit[], AiTranslatorConfig, string | undefined]
    >(async (units) =>
      units.map((unit: TranslationUnit) => ({
        ...unit,
        target: `${unit.source}:${unit.key}`,
      }))
    );

    const translatorEngine = {
      translateUnits: translateUnitsMock,
    } as unknown as TranslatorEngine<TranslationInput, TranslationUnit[], TranslationOutput>;

    const firstApply = jest.fn(async (_input, translatedUnits) => {
      const value = translatedUnits.map((unit: TranslationUnit) => unit.target ?? '').join('|');
      return new TranslationOutput([{ name: 'first.txt', success: true, result: value }]);
    });

    const secondApply = jest.fn(async (_input, translatedUnits) => {
      const value = translatedUnits.map((unit: TranslationUnit) => unit.target ?? '').join('|');
      return new TranslationOutput([{ name: 'second.txt', success: true, result: value }]);
    });

    await batchTranslateParsedResults({
      translatorEngine,
      parsedResults: [
        createParsedResult('first content', [{ key: 'line_0', source: 'hello' }], firstApply),
        createParsedResult('second content', [{ key: 'line_0', source: 'foo' }], secondApply),
      ],
      config: dummyConfig,
    });

    expect(translateUnitsMock).toHaveBeenCalledWith(
      [
        { key: 'batch:0:line_0', source: 'hello' },
        { key: 'batch:1:line_0', source: 'foo' },
      ],
      dummyConfig,
      undefined,
      undefined,
      expect.any(Function)
    );

    expect(firstApply).toHaveBeenCalledWith(expect.any(TranslationInput), [
      { key: 'line_0', source: 'hello', target: 'hello:batch:0:line_0' },
    ]);
    expect(secondApply).toHaveBeenCalledWith(expect.any(TranslationInput), [
      { key: 'line_0', source: 'foo', target: 'foo:batch:1:line_0' },
    ]);
  });

  it('restores strict failure metadata on apply', async () => {
    const translateUnitsMock = jest.fn<
      Promise<TranslationUnit[]>,
      [TranslationUnit[], AiTranslatorConfig, string | undefined]
    >(async (units) =>
      units.map((unit: TranslationUnit, index) => ({
        ...unit,
        target: `${unit.source}-tr`,
        strictFailed: index === 1,
        strictFailureReasons: index === 1 ? ['placeholder_mismatch'] : [],
      }))
    );

    const translatorEngine = {
      translateUnits: translateUnitsMock,
    } as unknown as TranslatorEngine<TranslationInput, TranslationUnit[], TranslationOutput>;

    const firstApply = jest.fn(async (_input, translatedUnits) => {
      return new TranslationOutput([{ name: 'first.txt', success: true, result: translatedUnits }]);
    });

    const secondApply = jest.fn(async (_input, translatedUnits) => {
      return new TranslationOutput([
        { name: 'second.txt', success: true, result: translatedUnits },
      ]);
    });

    await batchTranslateParsedResults({
      translatorEngine,
      parsedResults: [
        createParsedResult(
          'first content',
          [
            { key: 'line_0', source: 'hello' },
            { key: 'line_1', source: 'world' },
          ],
          firstApply
        ),
        createParsedResult('second content', [{ key: 'line_0', source: 'foo' }], secondApply),
      ],
      config: dummyConfig,
    });

    expect(firstApply).toHaveBeenCalledWith(expect.any(TranslationInput), [
      {
        key: 'line_0',
        source: 'hello',
        target: 'hello-tr',
        strictFailed: false,
        strictFailureReasons: [],
      },
      {
        key: 'line_1',
        source: 'world',
        target: 'world-tr',
        strictFailed: true,
        strictFailureReasons: ['placeholder_mismatch'],
      },
    ]);
    expect(secondApply).toHaveBeenCalledWith(expect.any(TranslationInput), [
      {
        key: 'line_0',
        source: 'foo',
        target: 'foo-tr',
        strictFailed: false,
        strictFailureReasons: [],
      },
    ]);
  });
});

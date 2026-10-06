import antfu from '@antfu/eslint-config'

export default antfu(
  {
    react: true,
    typescript: true,
    test: false,
    formatters: false,
    ignores: ['.agents/**', '.impeccable/**', '.idea/**', 'artifacts/**', 'public/**'],
  },
  {
    files: ['src/**/*.{ts,tsx}', 'vite.config.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'ts/no-deprecated': 'error',
    },
  },
  {
    files: ['src/features/messenger/model.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['*'],
              message: 'Модель переписки должна оставаться независимой от UI и сети.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/integrations/**/*.ts', 'src/features/messenger/pollNotifications.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react-dom',
                'react-dom/*',
                'lucide-react',
                '**/ui/**',
                '**/hooks/**',
                '**/useMessenger.ts',
                '**/auth/**',
                '**/app/**',
              ],
              message:
                'Интеграция и обработка уведомлений не должны зависеть от React и интерфейса.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/features/**', '**/integrations/**', '**/app/**'],
              message: 'Общий код не должен зависеть от экранов и интеграций.',
            },
          ],
        },
      ],
    },
  },
)

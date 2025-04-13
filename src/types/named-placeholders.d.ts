declare module 'named-placeholders' {
  export default function namedPlaceholders(): (sql: string, params: Record<string, any>) => [string, any[]];
}

import { z } from 'zod';

type JsonSchema = { type?: string | string[]; const?: unknown; enum?: unknown[]; anyOf?: JsonSchema[];
  oneOf?: JsonSchema[]; properties?: Record<string, JsonSchema>; required?: string[]; items?: JsonSchema;
  prefixItems?: JsonSchema[]; maxItems?: number; additionalProperties?: boolean | JsonSchema };

// Render the supported JSON Schema vocabulary into self-contained Studio ambient types.
// Unsupported schema shapes fail the build/test instead of silently widening to any.
function render(schema: JsonSchema): string {
  if ('const' in schema) return JSON.stringify(schema.const);
  if (schema.enum) return schema.enum.map(value => JSON.stringify(value)).join(' | ');
  const variants = schema.anyOf ?? schema.oneOf;
  if (variants) return variants.map(value => `(${render(value)})`).join(' | ');
  if (Array.isArray(schema.type)) return schema.type.map(type => render({ ...schema, type })).join(' | ');
  switch (schema.type) {
    case 'string': return 'string';
    case 'integer': case 'number': return 'number';
    case 'boolean': return 'boolean';
    case 'null': return 'null';
    case 'array':
      if (schema.maxItems === 0) return '[]';
      if (schema.prefixItems) return `[${schema.prefixItems.map(render).join(', ')}]`;
      if (schema.items) return `Array<${render(schema.items)}>`;
      break;
    case 'object': {
      const fields = Object.entries(schema.properties ?? {}).map(([key, value]) =>
        `${JSON.stringify(key)}${schema.required?.includes(key) ? '' : '?'}: ${render(value)};`);
      if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
        fields.push(`[key: string]: ${render(schema.additionalProperties)};`);
      }
      return `{ ${fields.join(' ')} }`;
    }
  }
  if (Object.keys(schema).length === 0) return 'unknown';
  throw new Error('CHAT_CONTRACT_DECLARATION_UNSUPPORTED');
}

export function chatContractDeclaration(name: string, schema: z.ZodType): string {
  if (!/^[A-Za-z]\w*$/.test(name)) throw new Error('CHAT_CONTRACT_DECLARATION_NAME_INVALID');
  return `type ${name} = ${render(z.toJSONSchema(schema, { reused: 'inline' }) as JsonSchema)};\n`;
}

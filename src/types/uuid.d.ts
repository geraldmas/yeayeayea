declare module 'uuid' {
  export function v4(): string;
  export function v1(): string;
  export function v3(name: string | Buffer, namespace: string | Buffer): string;
  export function v5(name: string | Buffer, namespace: string | Buffer): string;
  export function parse(uuid: string): Buffer;
  export function unparse(buffer: Buffer, offset?: number): string;
  export function stringify(arr: number[], offset?: number): string;
}
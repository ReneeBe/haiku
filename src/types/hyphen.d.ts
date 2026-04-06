declare module "hyphen/en" {
  export function hyphenateSync(text: string): string;
  export function hyphenate(text: string): Promise<string>;
}

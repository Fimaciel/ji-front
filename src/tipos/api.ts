export class ErroApi extends Error {
  constructor(
    public readonly codigo: string,
    mensagem: string,
    public readonly campos: Record<string, string> = {},
    public readonly status?: number,
  ) {
    super(mensagem)
    this.name = 'ErroApi'
  }
}

declare module 'pica' {
  type PicaInstance = {
    resize(
      from: HTMLCanvasElement,
      to: HTMLCanvasElement,
      options?: { alpha?: boolean },
    ): Promise<HTMLCanvasElement>
  }

  export default function pica(): PicaInstance
}

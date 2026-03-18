declare module 'snarkjs' {
  export namespace groth16 {
    function fullProve(
      input: Record<string, any>,
      wasmFile: string,
      zkeyFile: string
    ): Promise<{ proof: object; publicSignals: string[] }>;

    function verify(
      vkey: object,
      publicSignals: string[],
      proof: object
    ): Promise<boolean>;
  }
}

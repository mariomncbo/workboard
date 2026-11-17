/** Errors when reading or saving boards, lists and tasks. Same messages as macOS. */
export type DataFailure = "network" | "unexpected";

const MESSAGES: Record<DataFailure, string> = {
  network: "No hay conexión. Comprueba tu red y vuelve a probar.",
  unexpected: "No se han podido guardar los cambios. Vuelve a probar en unos segundos.",
};

export class DataFailureError extends Error {
  constructor(readonly failure: DataFailure) {
    super(MESSAGES[failure]);
    this.name = "DataFailureError";
  }
}

/** Wraps any error from Supabase or the network. */
export function toDataFailure(error: unknown): DataFailureError {
  if (error instanceof DataFailureError) return error;
  const isNetwork =
    error instanceof TypeError ||
    (typeof error === "object" && error !== null && "message" in error && String(error.message).includes("Failed to fetch"));
  return new DataFailureError(isNetwork ? "network" : "unexpected");
}

export function dataFailureMessage(failure: DataFailure): string {
  return MESSAGES[failure];
}

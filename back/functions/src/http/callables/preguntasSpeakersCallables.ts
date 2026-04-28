/**
 * Callable público: guarda en Sheet `PreguntasSpeakers` la pregunta para un speaker.
 */
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { agregarPreguntaSpeakerAlSheet } from "../../service/sheetService";
import { FIREBASE_CONFIG_ACCOUNT } from "../../configSecrets/firebaseConfigAccount";

const MAX_LEN = 2000;

export const guardarPreguntaSpeakerProd = onCall(
  { cors: true, secrets: [FIREBASE_CONFIG_ACCOUNT] },
  async (request) => {
    const data = request.data as {
      nombreSpeaker?: string;
      pregunta?: string;
    };

    const nombreSpeaker = String(data?.nombreSpeaker ?? "").trim();
    const pregunta = String(data?.pregunta ?? "").trim();

    if (!nombreSpeaker || !pregunta) {
      throw new HttpsError(
        "invalid-argument",
        "Enviá el nombre del speaker y la pregunta."
      );
    }
    if (nombreSpeaker.length > MAX_LEN || pregunta.length > MAX_LEN) {
      throw new HttpsError(
        "invalid-argument",
        "El texto es demasiado largo."
      );
    }

    try {
      await agregarPreguntaSpeakerAlSheet({ nombreSpeaker, pregunta });
      return { ok: true as const };
    } catch (e: unknown) {
      console.error("guardarPreguntaSpeakerProd:", e);
      throw new HttpsError("internal", "No se pudo guardar la pregunta. Intentá más tarde.");
    }
  }
);

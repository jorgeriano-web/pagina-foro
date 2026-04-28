/**
 * Envío de preguntas para speakers desde la landing → Cloud Function → Google Sheet.
 */
import { Injectable } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { CF_PREGUNTA_SPEAKER } from './preguntas-speaker.callables';

export interface PreguntaSpeakerPayload {
  nombreSpeaker: string;
  pregunta: string;
}

@Injectable({
  providedIn: 'root',
})
export class PreguntasSpeaker {
  constructor(private functions: Functions) {}

  async guardar(payload: PreguntaSpeakerPayload): Promise<void> {
    const callable = httpsCallable<PreguntaSpeakerPayload, { ok: boolean }>(
      this.functions,
      CF_PREGUNTA_SPEAKER,
    );
    await callable({
      nombreSpeaker: payload.nombreSpeaker.trim(),
      pregunta: payload.pregunta.trim(),
    });
  }
}

import { HttpsError } from "firebase-functions/v2/https";
import {agregarDatosClienteReservaSalaAlSheet,} from "./sheetService";

// --- Cuántos cupos tiene cada sala---

const CUPOS_MAXIMOS_SALA_1 = 30;
const CUPOS_MAXIMOS_SALA_2 = 40;
const CUPOS_MAXIMOS_SALA_3 = 45;
const CUPOS_MAXIMOS_SALA_4 = 50;

function cuposMaximosDeEstaSala(numeroSala: number): number {
  if (numeroSala === 1) return CUPOS_MAXIMOS_SALA_1;
  if (numeroSala === 2) return CUPOS_MAXIMOS_SALA_2;
  if (numeroSala === 3) return CUPOS_MAXIMOS_SALA_3;
  if (numeroSala === 4) return CUPOS_MAXIMOS_SALA_4;
  return 0;
}



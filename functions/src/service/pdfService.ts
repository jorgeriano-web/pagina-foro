import * as fs from 'fs';
import * as path from 'path';

export function obtenerPdf(){
    const rutaPdf = path.join(__dirname, '../../_Foro_2026.pdf');
    return fs.readFileSync(rutaPdf);
}
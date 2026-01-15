

export class PreciosService{

    private precios: {[key: number]: number} = {
    1: 280000,
    2: 520000,
    3: 640000
    }

    private cantidad: number = 0;
    private precio: number = 0;

    seleccionarBoletasYprecio(cantidad: number){
        if (!(cantidad in this.precios)) {
            throw new Error("Cantidad de boletas inválida. Solo se permiten 1, 2 o 3 boletas");
        }
        return this.precios[cantidad];
    }

    getCantidad(): number {
    return this.cantidad;
    }

    getPrecio(): number {
        return this.precio;
    }




}
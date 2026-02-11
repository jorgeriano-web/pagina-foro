

export class PreciosService{

    private precios: {[key: number]: number} = {
        1: 280000,
        2: 520000,
        3: 640000,
        4: 840000,
        5: 1000000,
        6: 1140000,
        7: 1260000,
        8: 1360000,
    }

    private cantidad: number = 0;
    private precio: number = 0;

    seleccionarBoletasYprecio(cantidad: number){
        if (!(cantidad in this.precios)) {
            throw new Error("Cantidad de boletas inválida.");
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
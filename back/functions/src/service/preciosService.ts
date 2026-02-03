

export class PreciosService{

    private precios: {[key: number]: number} = {
        1: 330000,
        2: 520000,
        3: 640000,
        4: 1000000,
        5: 1150000,
        6: 1320000,
        8: 1600000,
        10: 1900000,
        15: 2400000,
        20: 3000000,
        30: 4200000
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
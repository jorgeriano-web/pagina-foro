

export class PreciosService{

    private precios: {[key: number]: number} = {
        1: 330000,
        2: 620000,
        3: 780000,
        4: 1000000,
        5: 1150000,
        6: 1320000,
        7: 1470000,
        8: 1600000,
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
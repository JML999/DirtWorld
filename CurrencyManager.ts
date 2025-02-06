import { Player } from 'hytopia';

export interface PlayerCurrency {
    coins: number;
    // Can easily add more currency types later
    // gems?: number;
    // points?: number;
}

export class CurrencyManager {
    private currencies: Map<string, PlayerCurrency> = new Map();

    initializePlayer(player: Player) {
        this.currencies.set(player.id, {
            coins: 0
        });
        this.updateCurrencyUI(player);
    }

    addCoins(player: Player, amount: number) {
        const currency = this.currencies.get(player.id);
        if (!currency) return false;

        currency.coins += amount;
        this.updateCurrencyUI(player);
        return true;
    }

    removeCoins(player: Player, amount: number): boolean {
        const currency = this.currencies.get(player.id);
        if (!currency) return false;

        if (currency.coins < amount) return false;

        currency.coins -= amount;
        this.updateCurrencyUI(player);
        return true;
    }

    getCoins(player: Player): number {
        return this.currencies.get(player.id)?.coins || 0;
    }

    public updateCurrencyUI(player: Player) {
        const currency = this.currencies.get(player.id);
        if (!currency) return;

        player.ui.sendData({
            type: "currencyUpdate",
            currency: currency
        });
    }

    cleanup(player: Player) {
        this.currencies.delete(player.id);
    }
    
}
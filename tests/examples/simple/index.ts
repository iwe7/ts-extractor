// export function pickCard(x: { suit: string; card: number }[]): number;
// export function pickCard(x: number): { suit: string; card: number };
// export function pickCard(x: any): number | { suit: string; card: number } | undefined {
//     const suits = ["hearts", "spades", "clubs", "diamonds"];
//     // Check to see if we're working with an object/array
//     // if so, they gave us the deck and we'll pick the card
//     if (typeof x == "object") {
//         let pickedCard = Math.floor(Math.random() * x.length);
//         return pickedCard;
//     } else if (typeof x == "number") {
//         // Otherwise just let them pick the card
//         let pickedSuit = Math.floor(x / 13);
//         return { suit: suits[pickedSuit], card: x % 13 };
//     }
// }

export interface MyStuff {
    length: number;
}

export namespace NamespaceCards {
    export function pickCard(p1: string): string;
    export function pickCard(p1: MyStuff): string;
    export function pickCard(p1: string | MyStuff): string {
        return "card";
    }
}

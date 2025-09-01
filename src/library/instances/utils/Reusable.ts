export class Reusable {
    public static randomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    public static randomFloat(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    }

    public static lerp(start: number, end: number, t: number): number {
        return start + (end - start) * t;
    }
}
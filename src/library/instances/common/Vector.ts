/**
 * 2D Vector class for mathematical operations and position handling
 * Provides common vector operations like addition, subtraction, scaling, and normalization
 */
export class Vector {
    public x: number;
    public y: number;

    /**
     * Creates a new 2D vector with x and y components
     * @param x - The x component of the vector
     * @param y - The y component of the vector
     */
    public constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    /**
     * Checks if the vector is zero (both components are zero)
     * @returns True if the vector is zero, false otherwise
     */
    public isZero(): boolean {
        return this.x === 0 && this.y === 0;
    }

    /**
     * Checks if the vector components are NaN (Not-a-Number)
     * @returns True if either component is NaN, false otherwise
     */
    public isNaN(): boolean {
        return isNaN(this.x) || isNaN(this.y);
    }

    /**
     * Subtracts another vector from this vector
     * @param vector - The vector to subtract
     * @returns A new Vector representing the difference
     */
    public sub(vector: Vector): Vector {
        return new Vector(this.x - vector.x, this.y - vector.y);
    }

    /**
     * Adds another vector to this vector
     * @param vector - The vector to add
     * @returns A new Vector representing the sum
     */
    public add(vector: Vector): Vector {
        return new Vector(this.x + vector.x, this.y + vector.y);
    }

    /**
     * Scales this vector by a scalar value
     * @param scale - The scalar multiplier
     * @returns A new Vector scaled by the given factor
     */
    public scale(scale: number): Vector {
        return new Vector(this.x * scale, this.y * scale);
    }

    /**
     * Multiplies this vector component-wise with another vector
     * @param vector - The vector to multiply with
     * @returns A new Vector with components multiplied
     */
    public mul(vector: Vector): Vector {
        return new Vector(this.x * vector.x, this.y * vector.y);
    }

    /**
     * Divides this vector component-wise by another vector
     * @param vector - The vector to divide by
     * @returns A new Vector with components divided
     */
    public div(vector: Vector): Vector {
        return new Vector(this.x / vector.x, this.y / vector.y);
    }

    /**
     * Inverts the direction of this vector
     * @returns A new Vector with inverted components
     */
    public invert(): Vector {
        return new Vector(-this.x, -this.y);
    }

    /**
     * Inverts the x-component of this vector
     * @returns A new Vector with inverted x-component
     */
    public invertX(): Vector {
        return new Vector(-this.x, this.y);
    }

    /**
     * Inverts the y-component of this vector
     * @returns A new Vector with inverted y-component
     */
    public invertY(): Vector {
        return new Vector(this.x, -this.y);
    }

    /**
     * Calculates the length (magnitude) of this vector
     * @returns The Euclidean length of the vector
     */
    public len(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /**
     * Creates a unit vector in the same direction as this vector
     * @returns A new Vector with length 1 pointing in the same direction
     */
    public normalize(): Vector {
        const len = this.len();
        return new Vector(this.x / len, this.y / len);
    }

    /**
     * Creates a deep copy of this vector with identical properties
     * @returns A new Vector instance with the same configuration
     */
    public clone(): Vector {
        return new Vector(this.x, this.y);
    }

    /**
     * Returns a zero vector (0, 0)
     * @returns A new Vector with both components set to 0
     */
    public static get zero(): Vector {
        return new Vector(0, 0);
    }

    /**
     * Returns an up vector (0, -1)
     * @returns A new Vector pointing upwards
     */
    public static get up(): Vector {
        return new Vector(0, -1);
    }

    /**
     * Returns a down vector (0, 1)
     * @returns A new Vector pointing downwards
     */
    public static get down(): Vector {
        return new Vector(0, 1);
    }

    /**
     * Returns a left vector (-1, 0)
     * @returns A new Vector pointing left
     */
    public static get left(): Vector {
        return new Vector(-1, 0);
    }

    /**
     * Returns a right vector (1, 0)
     * @returns A new Vector pointing right
     */
    public static get right(): Vector {
        return new Vector(1, 0);
    }
}

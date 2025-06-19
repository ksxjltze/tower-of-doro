class Matrix3x3 extends Float32Array {
  constructor() {
    super(12);
    this.identity();
  }

  override set(arr: number[]): Matrix3x3 {
    if (arr.length !== 9) {
      throw new Error("Array must have exactly 9 elements.");
    }
    super.set(arr);
    return this;
  }

  static projection(width: number, height: number) {
    // Note: This matrix flips the Y axis so that 0 is at the top.
    const dst = new Matrix3x3();
    dst[0] = 2 / width;  dst[1] = 0;             dst[2] = 0;
    dst[4] = 0;          dst[5] = -2 / height;   dst[6] = 0;
    dst[8] = -1;         dst[9] = 1;             dst[10] = 1;
    return dst;
  };

  static identity() {
    const dst = new Matrix3x3();

    dst[0] = 1;  dst[1] = 0;  dst[2] = 0;
    dst[4] = 0;  dst[5] = 1;  dst[6] = 0;
    dst[8] = 0;  dst[9] = 0;  dst[10] = 1;

    return dst;
  };

  identity() {
    this[0] = 1;  this[1] = 0;  this[2] = 0;
    this[4] = 0;  this[5] = 1;  this[6] = 0;
    this[8] = 0;  this[9] = 0;  this[10] = 1;

    return this;
  }

  static multiply(a: Float32Array, b: Float32Array) {
    const dst = new Matrix3x3();

    const a00 = a[0 * 4 + 0];
    const a01 = a[0 * 4 + 1];
    const a02 = a[0 * 4 + 2];
    const a10 = a[1 * 4 + 0];
    const a11 = a[1 * 4 + 1];
    const a12 = a[1 * 4 + 2];
    const a20 = a[2 * 4 + 0];
    const a21 = a[2 * 4 + 1];
    const a22 = a[2 * 4 + 2];
    const b00 = b[0 * 4 + 0];
    const b01 = b[0 * 4 + 1];
    const b02 = b[0 * 4 + 2];
    const b10 = b[1 * 4 + 0];
    const b11 = b[1 * 4 + 1];
    const b12 = b[1 * 4 + 2];
    const b20 = b[2 * 4 + 0];
    const b21 = b[2 * 4 + 1];
    const b22 = b[2 * 4 + 2];

    dst[ 0] = b00 * a00 + b01 * a10 + b02 * a20;
    dst[ 1] = b00 * a01 + b01 * a11 + b02 * a21;
    dst[ 2] = b00 * a02 + b01 * a12 + b02 * a22;

    dst[ 4] = b10 * a00 + b11 * a10 + b12 * a20;
    dst[ 5] = b10 * a01 + b11 * a11 + b12 * a21;
    dst[ 6] = b10 * a02 + b11 * a12 + b12 * a22;

    dst[ 8] = b20 * a00 + b21 * a10 + b22 * a20;
    dst[ 9] = b20 * a01 + b21 * a11 + b22 * a21;
    dst[10] = b20 * a02 + b21 * a12 + b22 * a22;

    return dst;
  };

  static translation([tx, ty]: [number, number]) {
    const dst = new Matrix3x3();

    dst[0] = 1;   dst[1] = 0;   dst[2] = 0;
    dst[4] = 0;   dst[5] = 1;   dst[6] = 0;
    dst[8] = tx;  dst[9] = ty;  dst[10] = 1;

    return dst;
  };

  static rotation(angleInRadians: number) {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    const dst = new Matrix3x3();

    dst[0] = c;   dst[1] = s;  dst[2] = 0;
    dst[4] = -s;  dst[5] = c;  dst[6] = 0;
    dst[8] = 0;   dst[9] = 0;  dst[10] = 1;

    return dst;

  };

  static scaling([sx, sy]: [number, number]) {
    const dst = new Matrix3x3();

    dst[0] = sx;  dst[1] = 0;   dst[2] = 0;
    dst[4] = 0;   dst[5] = sy;  dst[6] = 0;
    dst[8] = 0;   dst[9] = 0;   dst[10] = 1;

    return dst;
  };

  static translate(m: Float32Array, translation: [number, number]) {
    return Matrix3x3.multiply(m, Matrix3x3.translation(translation));
  };

  static rotate(m: Float32Array, angleInRadians: number) {
    return Matrix3x3.multiply(m, Matrix3x3.rotation(angleInRadians));
  };

  static scale(m: Float32Array, scale: [number, number]) {
    return Matrix3x3.multiply(m, Matrix3x3.scaling(scale));
  };

  multiply(other: Float32Array) {
    const a00 = other[0 * 4 + 0];
    const a01 = other[0 * 4 + 1];
    const a02 = other[0 * 4 + 2];
    const a10 = other[1 * 4 + 0];
    const a11 = other[1 * 4 + 1];
    const a12 = other[1 * 4 + 2];
    const a20 = other[2 * 4 + 0];
    const a21 = other[2 * 4 + 1];
    const a22 = other[2 * 4 + 2];
    
    const b00 = this[0 * 4 + 0];
    const b01 = this[0 * 4 + 1];
    const b02 = this[0 * 4 + 2];
    const b10 = this[1 * 4 + 0];
    const b11 = this[1 * 4 + 1];
    const b12 = this[1 * 4 + 2];
    const b20 = this[2 * 4 + 0];
    const b21 = this[2 * 4 + 1];
    const b22 = this[2 * 4 + 2];

    this[ 0] = b00 * a00 + b01 * a10 + b02 * a20;
    this[ 1] = b00 * a01 + b01 * a11 + b02 * a21;
    this[ 2] = b00 * a02 + b01 * a12 + b02 * a22;

    this[ 4] = b10 * a00 + b11 * a10 + b12 * a20;
    this[ 5] = b10 * a01 + b11 * a11 + b12 * a21;
    this[ 6] = b10 * a02 + b11 * a12 + b12 * a22;

    this[ 8] = b20 * a00 + b21 * a10 + b22 * a20;
    this[ 9] = b20 * a01 + b21 * a11 + b22 * a21;
    this[10] = b20 * a02 + b21 * a12 + b22 * a22;

    return this;
  }

  multiplyAB(a: Float32Array, b: Float32Array) {
    const a00 = a[0 * 4 + 0];
    const a01 = a[0 * 4 + 1];
    const a02 = a[0 * 4 + 2];
    const a10 = a[1 * 4 + 0];
    const a11 = a[1 * 4 + 1];
    const a12 = a[1 * 4 + 2];
    const a20 = a[2 * 4 + 0];
    const a21 = a[2 * 4 + 1];
    const a22 = a[2 * 4 + 2];
    const b00 = b[0 * 4 + 0];
    const b01 = b[0 * 4 + 1];
    const b02 = b[0 * 4 + 2];
    const b10 = b[1 * 4 + 0];
    const b11 = b[1 * 4 + 1];
    const b12 = b[1 * 4 + 2];
    const b20 = b[2 * 4 + 0];
    const b21 = b[2 * 4 + 1];
    const b22 = b[2 * 4 + 2];

    this[ 0] = b00 * a00 + b01 * a10 + b02 * a20;
    this[ 1] = b00 * a01 + b01 * a11 + b02 * a21;
    this[ 2] = b00 * a02 + b01 * a12 + b02 * a22;

    this[ 4] = b10 * a00 + b11 * a10 + b12 * a20;
    this[ 5] = b10 * a01 + b11 * a11 + b12 * a21;
    this[ 6] = b10 * a02 + b11 * a12 + b12 * a22;

    this[ 8] = b20 * a00 + b21 * a10 + b22 * a20;
    this[ 9] = b20 * a01 + b21 * a11 + b22 * a21;
    this[10] = b20 * a02 + b21 * a12 + b22 * a22;

    return this;
  };

  translate(translation: [number, number]) {
    this.multiplyAB(this, Matrix3x3.translation(translation));
    
    return this;
  };

  rotate(angleInRadians: number) {
    this.multiplyAB(this, Matrix3x3.rotation(angleInRadians));

    return this;
  };

  scale(scale: [number, number]) {
    this.multiplyAB(this, Matrix3x3.scaling(scale));

    return this;
  };

  reset() {
    this[0] = 1;  this[1] = 0;  this[2] = 0;
    this[4] = 0;  this[5] = 1;  this[6] = 0;
    this[8] = 0;  this[9] = 0;  this[10] = 1;

    return this;
  }
}

export { Matrix3x3 };
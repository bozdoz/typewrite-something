/**
 * Vector class for handling positions
 */
function Vector (x, y) {
    this.set(x, y);
}

Vector.prototype.get = function (axis) {
    return this[axis];
};

Vector.prototype.set = function (x, y) {
    this.x = x;
    this.y = y;
}

Vector.prototype.add = function (vector) {
    if (typeof(vector) === 'number') {
        return new Vector(this.x + vector, this.y + vector);
    }
    return new Vector(this.x + vector.x, this.y + vector.y);
};

Vector.prototype._add = function (vector) {
    this.x += (vector.x === undefined) ? vector : vector.x;
    this.y += (vector.y === undefined) ? vector : vector.y;
    return this;
};

Vector.prototype.subtract = function (vector) {
    if (typeof(vector) === 'number') {
        return new Vector(this.x - vector, this.y - vector);
    }
    return new Vector(this.x - vector.x, this.y - vector.y);
};

Vector.prototype._subtract = function (vector) {
    this.x -= (vector.x === undefined) ? vector : vector.x;
    this.y -= (vector.y === undefined) ? vector : vector.y;
    return this;
};

Vector.prototype.divideBy = function (num) {
    return new Vector(this.x / num, this.y / num);
};

Vector.prototype._divideBy = function (num) {
    this.x /= num;
    this.y /= num;
    return this;
};

Vector.prototype.multiplyBy = function (num) {
    return new Vector(this.x * num, this.y * num);
};

Vector.prototype._multiplyBy = function (num) {
    this.x *= num;
    this.y *= num;
    return this;
};

Vector.prototype.distanceTo = function (vector) {
    var diff = vector.subtract(this),
        x = diff.x,
        y = diff.y;
    return Math.sqrt(x * x + y * y);
};

export default Vector
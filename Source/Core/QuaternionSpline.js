/*global define*/
define([
        './defaultValue',
        './defined',
        './DeveloperError',
        './Spline',
        './Quaternion'
    ], function(
        defaultValue,
        defined,
        DeveloperError,
        Spline,
        Quaternion) {
    "use strict";

    /**
     * A spline that uses spherical quadrangle (squad) interpolation to create a quaternion curve.
     *
     * @alias QuaternionSpline
     * @constructor
     *
     * @param {Array} options.points The array of control points.
     * @param {Array} options.times The array of control point times.
     * @param {Quaternion} [options.firstInnerQuadrangle] The inner quadrangle of the curve at the first control point.
     *                     If the inner quadrangle is not given, it will be estimated.
     * @param {Quaternion} [options.lastInnerQuadrangle] The inner quadrangle of the curve at the last control point.
     *                     If the inner quadrangle is not given, it will be estimated.
     *
     * @exception {DeveloperError} points is required.
     * @exception {DeveloperError} points.length must be greater than or equal to 3.
     * @exception {DeveloperError} times is required.
     * @exception {DeveloperError} times.length must be equal to points.length.
     */
    var QuaternionSpline = function(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        var points = options.points;
        var times = options.times;
        var firstInnerQuadrangle = options.firstInnerQuadrangle;
        var lastInnerQuadrangle = options.lastInnerQuadrangle;

        if (!defined(points)) {
            throw new DeveloperError('points is required.');
        }

        if (points.length < 3) {
            throw new DeveloperError('points.length must be greater than or equal to 3.');
        }

        if (!defined(times)) {
            throw new DeveloperError('times is required.');
        }

        if (times.length !== points.length) {
            throw new DeveloperError('times.length must be equal to points.length.');
        }

        var innerQuadrangles = computeInnerQuadrangles(points, firstInnerQuadrangle, lastInnerQuadrangle);

        /**
         * An array of {@link Quaternion} control points.
         * @type {Array}
         */
        this.points = points;

        /**
         * An array of times for the control points.
         * @type {Array}
         */
        this.times = times;

        /**
         * An array of {@link Quaternion} inner qradrangles for the control points.
         * @type {Array}
         */
        this.innerQuadrangles = innerQuadrangles;

        this._lastTimeIndex = 0;
    };

    function computeInnerQuadrangles(points, firstInnerQuadrangle, lastInnerQuadrangle) {
        var length = points.length;
        var quads = new Array(length);

        quads[0] = defined(firstInnerQuadrangle) ? firstInnerQuadrangle : points[0];
        quads[length - 1] = defined(lastInnerQuadrangle) ? lastInnerQuadrangle : points[length - 1];

        for (var i = 1; i < length - 1; ++i) {
            quads[i] = Quaternion.innerQuadrangle(points[i - 1], points[i], points[i + 1]);
        }

        return quads;
    }

    /**
     * Finds an index <code>i</code> in <code>times</code> such that the parameter
     * <code>time</code> is in the interval <code>[times[i], times[i + 1]]</code>.
     * @memberof QuaternionSpline
     *
     * @param {Number} time The time.
     * @returns {Number} The index for the element at the start of the interval.
     *
     * @exception {DeveloperError} time is required.
     * @exception {DeveloperError} time must be in the range <code>[t<sub>0</sub>, t<sub>n</sub>]</code>, where <code>t<sub>0</sub></code>
     *                             is the first element in the array <code>times</code> and <code>t<sub>n</sub></code> is the last element
     *                             in the array <code>times</code>.
     */
    QuaternionSpline.prototype.findTimeInterval = Spline.prototype.findTimeInterval;

    /**
     * Evaluates the curve at a given time.
     * @memberof QuaternionSpline
     *
     * @param {Number} time The time at which to evaluate the curve.
     * @param {Quaternion} [result] The object onto which to store the result.
     * @returns {Quaternion} The modified result parameter or a new instance of the point on the curve at the given time.
     *
     * @exception {DeveloperError} time is required.
     * @exception {DeveloperError} time must be in the range <code>[t<sub>0</sub>, t<sub>n</sub>]</code>, where <code>t<sub>0</sub></code>
     *                             is the first element in the array <code>times</code> and <code>t<sub>n</sub></code> is the last element
     *                             in the array <code>times</code>.
     */
    QuaternionSpline.prototype.evaluate = function(time, result) {
        var points = this.points;
        var quads = this.innerQuadrangles;
        var times = this.times;

        var i = this.findTimeInterval(time);
        var u = (time - times[i]) / (times[i + 1] - times[i]);

        if (!defined(result)) {
            result = new Quaternion();
        }

        var q0 = points[i];
        var q1 = points[i + 1];
        var s0 = quads[i];
        var s1 = quads[i + 1];

        return Quaternion.squad(q0, q1, s0, s1, u, result);
    };

    return QuaternionSpline;
});
